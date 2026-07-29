#!/usr/bin/env node
// Manifest detector — the first CPU detector in this repo that is NOT a pattern rule.
//
//   node detectors/manifest.mjs <repo> [--sarif] [--refresh]
//
// Three defect classes that no opengrep/ast-grep pattern can express, because
// none of them is a property of a single file's syntax. They are properties of
// the RELATIONSHIP between package.json, the import graph, and the outside world:
//
//   MANIFEST-HALLUCINATED-DEP  a declared dependency that does not exist on the
//                              registry — the slopsquatting signature (CWE-1357).
//                              An attacker who registers that exact name owns
//                              the next `npm install`.
//   MANIFEST-PHANTOM-IMPORT    code imports a package that package.json never
//                              declares (CWE-1104). Runs until it doesn't.
//   MANIFEST-VULNERABLE-DEP    a pinned version with a known advisory (CWE-1104).
//
// WHY A SEPARATE DETECTOR CLASS AT ALL: scoring SampleCo showed the rulepack
// tops out around 7 of 12 planted defects. Six of the nine it cannot reach need
// either manifest analysis (here) or cross-file graph analysis (Lodestone). More
// pattern rules cannot close that gap — a different kind of detector can.
//
// MEASURED FP SURFACE (2026-07-29), after four rounds of narrowing against real
// repos. shipwright 3, lodestone 3, repopulse 0, quarry 0. Every survivor is in a
// TEST file and every one is a technically-correct detection:
//   - shipwright e2e/boundary-fixtures/*/violation.ts — fixtures that import
//     undeclared packages ON PURPOSE, to prove a boundary check fires.
//   - lodestone src/tests/*.test.ts — Go source embedded in a template literal
//     (`import "fmt"` reads identically to a JS side-effect import), plus a
//     deliberate `nonexistent-package` phantom-import fixture.
// NOT suppressed by a test-path exclusion: a phantom import in a test file means
// the suite breaks on a clean install, which is worth knowing. Flagged here so
// the low actionability is a documented property rather than a surprise.
//
// Four FP classes were fixed rather than tolerated, each found by running against
// real repos before shipping: monorepo workspace manifests, workspace-internal
// package names, an incomplete hand-written builtin list (it omitted `module`),
// and an unanchored `from "..."` regex that matched English prose in comments.
//
// OFFLINE BY DEFAULT, and that is deliberate. The corpus gate runs on every push;
// a network call in that path would make a regression gate flaky and slow. Lookups
// come from a committed cache (detectors/registry-cache.json), refreshed
// explicitly with --refresh. A cache MISS is reported as UNVERIFIED, never as
// clean — the same discipline as the fixture runner's SKIP: a check that did not
// run must not read as a check that passed.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { builtinModules } from 'node:module';

const ROOT = new URL('..', import.meta.url).pathname;
const CACHE_PATH = join(ROOT, 'detectors', 'registry-cache.json');
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: manifest.mjs <repo> [--sarif] [--refresh]'); process.exit(2); }

const REFRESH = argv.includes('--refresh');
const pkgPath = join(target, 'package.json');
if (!existsSync(pkgPath)) {
  if (argv.includes('--sarif')) console.log(JSON.stringify(emptySarif()));
  else console.log('no package.json — manifest detector not applicable');
  process.exit(0);
}

const pkgText = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgText);
const declared = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies };
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : { packages: {} };

if (REFRESH) await refreshCache(Object.keys(declared), Object.entries(declared));

const findings = [];
let unverified = 0;

// ── 1 + 3. Declared dependencies: existence and advisories ──────────────────
for (const [name, range] of Object.entries(declared)) {
  const entry = cache.packages[name];
  if (!entry) { unverified++; continue; }
  const line = manifestLineOf(name);
  if (entry.exists === false) {
    findings.push({ rule: 'MANIFEST-HALLUCINATED-DEP', cwe: ['1357'], line,
      message: `"${name}" is declared in package.json but does not exist on the npm registry (HTTP 404). This is the slopsquatting signature: an AI-suggested package name that was never real. If an attacker registers this exact name, the next install executes their code. Verify the intended package or remove it.` });
  }
  const pinned = String(range).replace(/^[\^~>=<\s]*/, '');
  const advisories = (entry.advisories || []).filter((a) => versionAffected(pinned, a));
  if (advisories.length) {
    findings.push({ rule: 'MANIFEST-VULNERABLE-DEP', cwe: ['1104'], line,
      message: `"${name}@${range}" has ${advisories.length} known advisor${advisories.length === 1 ? 'y' : 'ies'} (${advisories.map((a) => a.id).slice(0, 3).join(', ')}). Upgrade to a fixed version.` });
  }
}

// ── 2. Phantom imports: code requires what the manifest never declares ──────
// Scoped to first-party source: node_modules and build output are not ours, and
// a phantom import inside a dependency is that dependency's problem.
// The authoritative list from the running Node, not a hand-maintained one.
// The hand-written version omitted `module` (among others) and reported
// `import { createRequire } from "module"` as an undeclared package.
const BUILTIN = new Set(builtinModules);

// MONOREPO AWARENESS. A workspace declares its own dependencies in its own
// package.json, so checking every file against the ROOT manifest alone reports
// the entire repo as phantom imports. Caught on shipwright before this shipped:
// `zod`, imported in packages/validators/ and declared in
// packages/validators/package.json, was reported as undeclared.
//
// Every package.json in the tree is collected, and a file is checked against
// the union of its NEAREST ancestor manifest and the root. That is deliberately
// the conservative direction — a dependency declared in a sibling workspace can
// mask a genuine phantom import, and under-reporting is the right failure mode
// for a detector whose whole selling point is that its findings are real.
const manifests = new Map();
// A monorepo's own packages resolve via the workspace link, not via a
// dependency entry. repopulse's e2e/ imports @repopulse/shared, which is a
// sibling workspace -- undeclared in any manifest and perfectly resolvable.
const workspaceNames = new Set();
for (const mf of walkManifests(target)) {
  try { const j = JSON.parse(readFileSync(mf, 'utf8'));
    if (j.name) workspaceNames.add(j.name);
    manifests.set(dirname(mf), new Set(Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.peerDependencies, ...j.optionalDependencies })));
  } catch { /* unparseable package.json is not this detector's problem */ }
}
function declaredFor(file) {
  const names = new Set([...Object.keys(declared), ...workspaceNames]);
  let dir = dirname(file);
  for (;;) {
    if (manifests.has(dir)) { for (const n of manifests.get(dir)) names.add(n); break; }
    const up = dirname(dir);
    if (up === dir || !dir.startsWith(target)) break;
    dir = up;
  }
  return names;
}

const seenPhantom = new Set();
for (const file of walkSource(target)) {
  const text = readFileSync(file, 'utf8');
  const localDeclared = declaredFor(file);
  const specs = [
    ...text.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...text.matchAll(/^\s*import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/gm),
    // Anchored to a statement start. An unanchored /\bfrom\s+["']...["']/
    // matches PROSE — it pulled "same provider, no vector yet" out of a comment
    // in shipwright and reported it as an undeclared package.
    ...text.matchAll(/^\s*export\s+(?:[\w*{},\s]+\s+)?from\s+['"]([^'"]+)['"]/gm),
    ...text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];
  for (const m of specs) {
    const spec = m[1];
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) continue;
    // Bare specifier → package name (handles @scope/name and deep paths).
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    // Second guard: a real npm package name cannot contain spaces, commas or
    // uppercase. Anything failing this came from prose or a template, not an
    // import, and reporting it would be indefensible in a customer report.
    if (!/^(@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) continue;
    if (BUILTIN.has(name) || localDeclared.has(name)) continue;
    const key = `${file}:${name}`;
    if (seenPhantom.has(key)) continue;
    seenPhantom.add(key);
    findings.push({ rule: 'MANIFEST-PHANTOM-IMPORT', cwe: ['1104'], file: relative(target, file),
      line: lineOfMatch(text, m[0]),
      message: `"${name}" is imported here but is not declared in package.json. Either the dependency is missing (this code fails on a clean install) or the import is left over from generated code that was never wired up.` });
  }
}

// ── output ──────────────────────────────────────────────────────────────────
if (argv.includes('--sarif')) { console.log(JSON.stringify(toSarif(findings))); process.exit(0); }

const label = (r) => r.replace('MANIFEST-', '');
if (!findings.length) console.log('manifest detector: 0 findings');
else {
  console.log(`manifest detector: ${findings.length} finding(s)\n`);
  for (const f of findings) console.log(`  ${label(f.rule).padEnd(18)} ${f.file || 'package.json'}:${f.line}\n    ${f.message}\n`);
}
if (unverified) {
  // Never silently clean. This is the same discipline as the fixture runner's
  // SKIP: a dependency we could not look up is UNVERIFIED, not verified-good.
  console.log(`⚠ ${unverified} dependenc${unverified === 1 ? 'y' : 'ies'} not in the registry cache — UNVERIFIED, not clean.`);
  console.log(`  Refresh with: node detectors/manifest.mjs ${target} --refresh`);
}

// ── helpers ─────────────────────────────────────────────────────────────────
function manifestLineOf(depName) {
  const lines = pkgText.split('\n');
  const i = lines.findIndex((l) => new RegExp(`"${depName.replace(/[/@]/g, '\\$&')}"\\s*:`).test(l));
  return i >= 0 ? i + 1 : 1;
}
function lineOfMatch(text, needle) {
  const i = text.indexOf(needle);
  return i < 0 ? 1 : text.slice(0, i).split('\n').length;
}
function* walkManifests(dir, depth = 0) {
  if (depth > 6) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkManifests(p, depth + 1);
    else if (e.name === "package.json") yield p;
  }
}
function* walkSource(dir, depth = 0) {
  if (depth > 8) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'build' || e.name === 'coverage') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkSource(p, depth + 1);
    else if (/\.(m|c)?[jt]sx?$/.test(e.name)) yield p;
  }
}
// Deliberately crude: "is the pinned version at or below the advisory's fixed
// version". Real semver range resolution needs the full range algebra, and
// getting it subtly wrong would produce confident-but-false advisories. When the
// comparison is not decidable, the advisory is NOT reported.
function versionAffected(pinned, adv) {
  if (!adv.fixed || !/^\d+\.\d+\.\d+/.test(pinned)) return false;
  return cmp(pinned, adv.fixed) < 0;
}
function cmp(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
}
function emptySarif() { return { version: '2.1.0', runs: [{ tool: { driver: { name: 'bpm-manifest-detector', rules: [] } }, results: [] }] }; }
function toSarif(fs) {
  const ids = [...new Set(fs.map((f) => f.rule))];
  return { version: '2.1.0', runs: [{
    tool: { driver: { name: 'bpm-manifest-detector', rules: ids.map((id) => ({ id, properties: { tags: [`CWE-${fs.find((f) => f.rule === id).cwe[0]}`] } })) } },
    results: fs.map((f) => ({ ruleId: f.rule, level: 'warning', message: { text: f.message },
      locations: [{ physicalLocation: { artifactLocation: { uri: join(target, f.file || 'package.json') }, region: { startLine: f.line } } }] })),
  }] };
}
async function refreshCache(names, entries) {
  console.error(`refreshing registry cache for ${names.length} package(s)...`);
  cache.packages ??= {};
  for (const name of names) {
    const rec = { exists: true, advisories: [], checkedAt: new Date().toISOString().slice(0, 10) };
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(8000) });
      if (res.status === 404) rec.exists = false;
      else if (!res.ok) { console.error(`  ? ${name}: HTTP ${res.status} — leaving UNVERIFIED`); continue; }
    } catch (e) { console.error(`  ? ${name}: ${e.message} — leaving UNVERIFIED`); continue; }
    if (rec.exists) {
      const version = String(Object.fromEntries(entries)[name] || '').replace(/^[\^~>=<\s]*/, '');
      try {
        const res = await fetch('https://api.osv.dev/v1/query', { method: 'POST', signal: AbortSignal.timeout(8000),
          body: JSON.stringify({ package: { name, ecosystem: 'npm' }, ...(/^\d+\.\d+\.\d+/.test(version) ? { version } : {}) }) });
        if (res.ok) {
          const body = await res.json();
          for (const v of body.vulns || []) {
            const fixed = v.affected?.[0]?.ranges?.[0]?.events?.find((e) => e.fixed)?.fixed;
            rec.advisories.push({ id: v.id, fixed: fixed || null });
          }
        }
      } catch { /* advisories stay empty; existence is still recorded */ }
    }
    cache.packages[name] = rec;
    console.error(`  ${rec.exists ? '✓' : '✗ MISSING'} ${name}${rec.advisories.length ? `  (${rec.advisories.length} advisories)` : ''}`);
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
  console.error(`cache written → ${relative(ROOT, CACHE_PATH)}`);
}
