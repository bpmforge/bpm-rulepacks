#!/usr/bin/env node
// ⚠ NOT SHIPPABLE YET. DELIBERATELY NOT WIRED INTO score-corpus.mjs.
//
// Measured against the fleet (node detectors/reachability.mjs --sweep), and the
// numbers are not defensible:
//
//   shipwright   432 L1 / 130 L0     <- not credible for a repo of that size
//   lodestone     28 L1 /  17 L0
//   quarry         9 L1 /  13 L0
//   repopulse, threatforge, ai-daytrader, kryptkeeper, retroforge
//                NOT COMPUTED — no entry points found
//
// TWO SPECIFIC DEFECTS, both mine, both found by the sweep rather than by
// reasoning about the code:
//
//   1. ENTRY-POINT SEEDING IS TOO NARROW. It reads package.json
//      main/module/bin/exports from the ROOT only. A monorepo declares entries
//      per workspace, and a server app often declares none at all — its real
//      entry is a bootstrap file no manifest names. Five of eight repos have no
//      discoverable entry, so reachability is undefined for them, and
//      shipwright's 432 is the same defect failing loudly instead of quietly:
//      most of its tree is unreachable from the root manifest by construction.
//
//   2. FRAMEWORK REGISTRATION IS NOT AN IMPORT EDGE. `registerExportRoutes` and
//      `registerDecisionRoutes` appear in the L1 list, and those are REAL
//      instances — both are named in the design note as genuine built-but-
//      unwired finds. But a route registered via a plugin table or a glob
//      import has no static edge to follow, so this detector cannot yet tell
//      those true positives apart from the hundreds of false ones around them.
//
// The first version of this file was worse in a more interesting way: it asked
// "is this symbol referenced OUTSIDE its own file?" rather than "is it reachable
// from an entry point?" — so every helper exported for testability read as
// unwired. `isWithinQuietHours` was flagged while living in a module three
// production files import. Fixed by computing a real transitive closure; the
// remaining problem is that the closure is seeded wrong.
//
// It is committed rather than discarded because the sweep harness, the
// entry-point discipline (NOT COMPUTED, never a false clean) and the L0/L1
// distinction are all sound and worth building on. What it needs is proper
// entry-point discovery — per-workspace manifests, bootstrap-file heuristics,
// and framework route/plugin registration as graph edges. That is Lodestone's
// symbol graph, which already carries `defs`/`refs`/`calls`/`imports`, rather
// than the file-level approximation here.
//
// DO NOT wire this into the scorer or quote its numbers until that lands.
//
// ── original design notes ───────────────────────────────────────────────────
//
// Built-but-unwired detector (ANTI_SLOP R-26). The defect class ticket-driven
// agent development produces most, and the one mainstream tools do not name.
//
//   node detectors/reachability.mjs <repo> [--sarif] [--sweep]
//
// Everything else finds *unused exports*. Nothing separates
//
//     L0/L3  nothing references this at all          -> dead code
//     L1     ONLY the tests reference this           -> BUILT-BUT-UNWIRED
//
// L1 is the one that reads as "you paid for a feature that is not in your
// product". It is the structural failure mode of ticket-driven agent work: a
// ticket says "build X with tests", the agent builds X with tests, the gate
// confirms the tests pass, the ticket closes — and nothing ever wires X in.
// Every quality gate asks "does it work?" and none asks "is it reached?"
//
// PRECISION IS THE WHOLE BATTLE. A false "your feature is unreachable" is the
// most embarrassing finding a report can contain, so every ambiguity here is
// resolved toward silence:
//
//   - Reference matching is by identifier NAME, with no path resolution. Two
//     same-named symbols in different files conflate, which OVER-links the
//     graph and therefore UNDER-reports unreachable code. Wrong in the safe
//     direction, deliberately.
//   - Package entry points (package.json main/module/exports/bin, and any
//     index file) are skipped outright: for a library, the export IS the
//     product, and "nothing in this repo calls it" says nothing about whether
//     consumers do.
//   - A symbol re-exported anywhere (`export * from`, `export { x } from`) is
//     treated as reachable.
//   - Framework/lifecycle names that are invoked by convention rather than by
//     an explicit call are skipped.
//
// The cost of all that is missed real instances. That is the correct trade for
// a detector whose entire value proposition is that its findings are true.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

// Declared here, above analyze()'s top-level call site: a const below it is
// still in its TDZ. Second time this exact trap has bitten a detector today.
// Invoked by a framework or runtime, not by an explicit call site in the repo.
const CONVENTION = new Set(['default', 'handler', 'middleware', 'setup', 'teardown', 'beforeAll', 'afterAll',
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'loader', 'action', 'config', 'metadata',
  'generateMetadata', 'getServerSideProps', 'getStaticProps', 'getStaticPaths', 'middleware_', 'register',
  'activate', 'deactivate', 'main', 'run', 'up', 'down', 'seed', 'plugin']);

if (argv.includes('--sweep')) { await sweep(); process.exit(0); }

const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: reachability.mjs <repo> [--sarif] [--sweep]'); process.exit(2); }
const result = analyze(target);
const findings = result.findings;
if (result.unknown) console.error(`reachability: NOT COMPUTED — ${result.unknown}`);

if (argv.includes('--sarif')) { console.log(JSON.stringify(toSarif(findings, target))); process.exit(0); }
report(findings, target);

// ── analysis ────────────────────────────────────────────────────────────────
function analyze(repo) {
  const files = [...walk(repo)];
  const texts = new Map(files.map((f) => [f, safeRead(f)]));
  const entryFiles = entryPoints(repo, files);

  // WITHOUT ENTRY POINTS THERE IS NO REACHABILITY. If none can be determined,
  // every file looks orphaned and the detector would report the entire
  // repository as unwired. Report that it could not run — never a false clean,
  // and never a catastrophic false positive.
  if (entryFiles.size === 0) return { unknown: 'no entry points found (package.json main/module/bin/exports)', findings: [] };

  // File-level import graph over LOCAL specifiers only.
  const importsOf = new Map();
  for (const f of files) {
    const set = new Set();
    for (const m of texts.get(f).matchAll(/(?:from\s*|require\(\s*)['"](\.[^'"]*)['"]/g)) {
      const r = resolveLocal(f, m[1], texts);
      if (r) set.add(r);
    }
    importsOf.set(f, set);
  }

  // Transitive closure from the entry points, through PRODUCTION imports only.
  // A file reached only by a test is not reached.
  const reachable = new Set();
  const stack = [...entryFiles].filter((f) => texts.has(f));
  while (stack.length) {
    const f = stack.pop();
    if (reachable.has(f)) continue;
    reachable.add(f);
    for (const dep of importsOf.get(f) || []) if (!isTest(dep)) stack.push(dep);
  }

  const out = [];
  for (const file of files) {
    if (isTest(file) || reachable.has(file)) continue;
    const names = exportedNames(texts.get(file));
    if (!names.size) continue;

    // Is this ORPHANED FILE referenced by any test at all?
    let testRefs = 0;
    const testSites = [];
    for (const [other, text] of texts) {
      if (!isTest(other)) continue;
      if ((importsOf.get(other) || new Set()).has(file)) { testRefs++; testSites.push(relative(repo, other)); continue; }
      for (const n of names) if (countRefs(text, n)) { testRefs++; testSites.push(relative(repo, other)); break; }
    }

    // A file nothing imports and nothing references anywhere: report the FILE
    // once, not every symbol in it. "17 unreachable exports" in one dead module
    // is one finding, and listing them separately is the volume-as-severity
    // mistake the scan tool already warns about.
    const sample = [...names].slice(0, 4);
    out.push({
      name: sample.join(', ') + (names.size > sample.length ? `, +${names.size - sample.length} more` : ''),
      file: relative(repo, file), line: defLine(texts.get(file), sample[0]),
      level: testRefs > 0 ? 'L1' : 'L0',
      symbolCount: names.size,
      testSites: [...new Set(testSites)],
    });
  }
  return { unknown: null, findings: out };
}

// Resolve a relative specifier to a file we actually walked. Extension-less and
// directory-index forms both occur; anything unresolvable is dropped, which
// UNDER-links the graph and therefore OVER-reports — the one place this detector
// errs toward noise, so it is bounded to specifiers we can see.
function resolveLocal(from, spec, texts) {
  const baseP = join(dirname(from), spec);
  const cands = [baseP, ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].flatMap((e) => [baseP + e, join(baseP, 'index' + e)])];
  for (const c of cands) if (texts.has(c)) return c;
  return null;
}

// ── export extraction ───────────────────────────────────────────────────────
function exportedNames(t) {
  const names = new Set();
  // ESM
  for (const m of t.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of t.matchAll(/export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of t.matchAll(/export\s*\{([^}]*)\}(?!\s*from)/g)) {
    for (const p of m[1].split(',')) {
      const parts = p.trim().split(/\s+as\s+/);
      const exposed = (parts[1] || parts[0] || '').trim();
      if (exposed && exposed !== 'default') names.add(exposed);
    }
  }
  // CommonJS
  for (const m of t.matchAll(/(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/g)) names.add(m[1]);
  for (const m of t.matchAll(/module\.exports\s*=\s*\{([^}]*)\}/g)) {
    for (const p of m[1].split(',')) {
      const [key, ...rest] = p.split(':');
      const c = key.trim();
      if (!/^[A-Za-z_$][\w$]*$/.test(c)) continue;
      // Shorthand (`{ validateInvoice }`) or an identifier value (`{ v: fn }`)
      // is a code entity. A literal value (`{ jwtSecret: "..." }`) is DATA, and
      // "this config key is unused" is not the finding this detector makes —
      // reporting it as built-but-unwired would bury the real ones in noise.
      // sampleco surfaced this immediately: config.js's jwtSecret and port read
      // as unreferenced exports alongside the genuine validateInvoice.
      const value = rest.join(':').trim();
      if (value && !/^[A-Za-z_$][\w$.]*$/.test(value)) continue;
      names.add(c);
    }
  }
  return names;
}
function defLine(t, name) {
  const lines = t.split('\n');
  const re = new RegExp(`(function|const|let|var|class)\\s+${esc(name)}\\b`);
  const i = lines.findIndex((l) => re.test(l));
  if (i >= 0) return i + 1;
  const j = lines.findIndex((l) => new RegExp(`\\b${esc(name)}\\b`).test(l));
  return j >= 0 ? j + 1 : 1;
}
// A reference is the identifier appearing anywhere outside a comment. Crude on
// purpose — over-counting references means under-reporting unreachable code.
function countRefs(t, name) {
  const re = new RegExp(`\\b${esc(name)}\\b`, 'g');
  let n = 0;
  for (const line of t.split('\n')) {
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    n += (code.match(re) || []).length;
  }
  return n;
}

// ── file classification ─────────────────────────────────────────────────────
function isTest(f) { return /(\.|\/|^)(test|spec)\.|\/(tests?|specs?|__tests__|e2e)\//i.test(f); }
function isIndex(f) { return /\/index\.[mc]?[jt]sx?$/.test(f); }
function entryPoints(repo) {
  const set = new Set();
  const pj = join(repo, 'package.json');
  if (!existsSync(pj)) return set;
  let j; try { j = JSON.parse(readFileSync(pj, 'utf8')); } catch { return set; }
  const add = (p) => { if (typeof p === 'string') set.add(join(repo, p.replace(/^\.\//, ''))); };
  add(j.main); add(j.module); add(j.browser);
  if (typeof j.bin === 'string') add(j.bin); else for (const v of Object.values(j.bin || {})) add(v);
  const walkExports = (e) => { if (typeof e === 'string') add(e); else if (e && typeof e === 'object') for (const v of Object.values(e)) walkExports(v); };
  walkExports(j.exports);
  return set;
}

function* walk(dir, depth = 0) {
  if (depth > 10) return;
  let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out', 'vendor'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p, depth + 1);
    else if (/\.[mc]?[jt]sx?$/.test(e.name) && !/\.d\.ts$/.test(e.name)) yield p;
  }
}
function safeRead(f) { try { return readFileSync(f, 'utf8'); } catch { return ''; } }
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── output ──────────────────────────────────────────────────────────────────
function report(fs_, repo) {
  const l1 = fs_.filter((f) => f.level === 'L1');
  const l0 = fs_.filter((f) => f.level === 'L0');
  console.log(`reachability: ${basename(repo)} — ${l1.length} built-but-unwired (L1), ${l0.length} unreferenced (L0)\n`);
  if (l1.length) {
    console.log('BUILT-BUT-UNWIRED — only the tests reference these:');
    for (const f of l1) console.log(`  ${f.file}:${f.line}  ${f.name}\n      referenced only by: ${f.testSites.slice(0, 3).join(', ')}`);
    console.log();
  }
  if (l0.length) {
    console.log('UNREFERENCED — exported, nothing references them anywhere:');
    for (const f of l0) console.log(`  ${f.file}:${f.line}  ${f.name}`);
  }
}
function toSarif(fs_, repo) {
  const rules = [
    { id: 'REACH-BUILT-BUT-UNWIRED', properties: { tags: ['CWE-561'] } },
    { id: 'REACH-UNREFERENCED-EXPORT', properties: { tags: ['CWE-561'] } },
  ];
  return { version: '2.1.0', runs: [{ tool: { driver: { name: 'bpm-reachability-detector', rules } },
    results: fs_.map((f) => ({
      ruleId: f.level === 'L1' ? 'REACH-BUILT-BUT-UNWIRED' : 'REACH-UNREFERENCED-EXPORT',
      level: 'warning',
      message: { text: f.level === 'L1'
        ? `"${f.name}" is exported and exercised by tests (${f.testSites.slice(0, 2).join(', ')}) but NOTHING in production code references it (ANTI_SLOP R-26, CWE-561). The tests prove it works; nothing proves it runs. Either wire it into the code path it was built for, or delete it.`
        : `"${f.name}" is exported here and referenced nowhere in this repository — not by production code, not even by a test (CWE-561). Either it is dead, or its only consumer is outside this repo.` },
      locations: [{ physicalLocation: { artifactLocation: { uri: join(repo, f.file) }, region: { startLine: f.line } } }],
    })) }] };
}

// ── sweep: the mechanical FP survey, so nobody re-derives it by hand ────────
async function sweep() {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'scripts', 'sweep-repos.json'), 'utf8'));
  const repos = cfg.repos.map((r) => r.replace(/^~/, process.env.HOME));
  console.log('| Repo | L1 built-but-unwired | L0 unreferenced |');
  console.log('|---|---|---|');
  const all = [];
  for (const r of repos) {
    if (!existsSync(r)) { console.log(`| ${basename(r)} | **MISSING** | **MISSING** |`); continue; }
    const res = analyze(r);
    if (res.unknown) { console.log(`| ${basename(r)} | **NOT COMPUTED** | ${res.unknown} |`); continue; }
    const f = res.findings;
    all.push([r, f]);
    console.log(`| ${basename(r)} | ${f.filter((x) => x.level === 'L1').length} | ${f.filter((x) => x.level === 'L0').length} |`);
  }
  console.log('\n### L1 findings, for triage (the headline class)\n');
  console.log('| Repo | Symbol | Location | Only referenced by |');
  console.log('|---|---|---|---|');
  for (const [r, f] of all) for (const x of f.filter((y) => y.level === 'L1')) {
    console.log(`| ${basename(r)} | \`${x.name}\` | \`${x.file}:${x.line}\` | ${x.testSites.slice(0, 2).join(', ')} |`);
  }
}
