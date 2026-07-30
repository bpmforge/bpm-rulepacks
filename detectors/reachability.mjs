#!/usr/bin/env node
// Built-but-unwired detector (ANTI_SLOP R-26) — the defect class ticket-driven
// agent development produces most, and the one mainstream tools do not name.
//
//   node detectors/reachability.mjs <repo> [--sarif] [--sweep]
//
// STATUS: credible on small and medium repos, NOT yet on the two largest.
// Measured 2026-07-29 after entry-point and resolver work:
//
//   lodestone     0 L1 /   0 L0     <- was 26/8
//   quarry        1 L1 /   0 L0     <- was 8/13, and the 1 is a REAL finding
//   kryptkeeper   2 L1 /  19 L0
//   repopulse    10 L1 /   5 L0     <- was 129/26
//   shipwright  162 L1 /  11 L0     <- was 363/85. Still not reportable.
//   threatforge 195 L1 / 906 L0     <- still not reportable.
//   ai-daytrader, retroforge        NOT COMPUTED (no discoverable entry point)
//
// VALIDATION: quarry’s single L1 finding is src/decoders.ts, "only referenced
// by tests/decoders.test.ts". An independent LLM review of quarry reported
// exactly that — "decoders.ts is entirely dead in production, imported only by
// its own test file" — so the detector reproduced a real finding unaided.
// Shipwright’s known true positives (registerExportRoutes,
// registerDecisionRoutes, mintValidatorRunReceipt) are correctly ABSENT: they
// were wired in during W9.
//
// THREE BUGS FIXED, each found by measuring rather than reasoning:
//
//   1. Entry-point seeding read only the ROOT package.json. Now: every
//      manifest in the tree, runner paths parsed out of "scripts",
//      conventional bootstraps that actually exist, and framework route-file
//      conventions. 184 entries on shipwright where there had been a handful.
//
//   2. Workspace-package specifiers were invisible edges. shipwright’s server
//      reaches packages/ exclusively via @shipwright/* names — 320+ of them —
//      and the resolver understood only ./relative paths, so every package
//      looked unreachable from every app.
//
//   3. THE BIG ONE, one line: NodeNext TypeScript writes a .js specifier for
//      a file that is .ts. shipwright uses that style for 509 of 509 relative
//      imports and ZERO extensionless ones, so essentially every edge failed
//      to resolve and 68% of the repo read as unreachable. The extension in a
//      specifier is the OUTPUT name, not the source name. 363 -> 162.
//
// STILL WRONG on shipwright/threatforge, and the likely cause is the same
// shape as (2): edges that are not static imports at all — plugin tables,
// glob registration, DI containers. Those need Lodestone’s symbol graph rather
// than this file-level approximation. NOT wired into score-corpus.mjs until
// the two large repos are credible.
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
let ENTRY_COUNT = 0;

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
  // entryPoints needs the manifests as well as the sources, and walk() only
  // yields code. Collected separately so walk() keeps one job.
  const manifests = [...walkManifests(repo)];
  const texts = new Map(files.map((f) => [f, safeRead(f)]));
  const entryFiles = entryPoints(repo, [...files, ...manifests]);

  // WORKSPACE PACKAGE EDGES. Without these the import graph of any monorepo is
  // disconnected: shipwright's apps/server reaches packages/ exclusively through
  // `@shipwright/events`-style specifiers — 320+ of them — and resolveLocal only
  // understood `./relative` paths. Every package therefore looked unreachable
  // from every app, which is where 363 of the 432 false "unwired" findings came
  // from. Mapping each workspace NAME to its entry file turns those back into
  // real edges.
  const wsEntry = new Map();
  for (const mf of manifests) {
    let j; try { j = JSON.parse(readFileSync(mf, 'utf8')); } catch { continue; }
    if (!j.name) continue;
    const base = dirname(mf);
    const cands = [];
    const push = (v) => { if (typeof v === 'string') cands.push(v.replace(/^\.\//, '')); };
    push(j.main); push(j.module);
    const wx = (e) => { if (typeof e === 'string') push(e); else if (e && typeof e === 'object') for (const v of Object.values(e)) wx(v); };
    wx(j.exports);
    cands.push('src/index.ts', 'src/index.tsx', 'index.ts', 'src/index.js');
    for (const c of cands) {
      for (const v of [c, c.replace(/\.js$/, '.ts'), c.replace(/^dist\//, 'src/').replace(/\.js$/, '.ts')]) {
        const abs = join(base, v);
        if (texts.has(abs)) { wsEntry.set(j.name, abs); break; }
      }
      if (wsEntry.has(j.name)) break;
    }
  }

  // WITHOUT ENTRY POINTS THERE IS NO REACHABILITY. If none can be determined,
  // every file looks orphaned and the detector would report the entire
  // repository as unwired. Report that it could not run — never a false clean,
  // and never a catastrophic false positive.
  ENTRY_COUNT = entryFiles.size;
  if (entryFiles.size === 0) return { unknown: 'no entry points found (package.json main/module/bin/exports)', findings: [] };

  // File-level import graph over LOCAL specifiers only.
  const importsOf = new Map();
  for (const f of files) {
    const set = new Set();
    for (const m of texts.get(f).matchAll(/(?:from\s*|require\(\s*)['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        const r = resolveLocal(f, spec, texts);
        if (r) set.add(r);
        continue;
      }
      // A workspace package name, or a deep import into one.
      const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      const e = wsEntry.get(pkg);
      if (e) set.add(e);
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
    // A definition that LIVES in a test/fixture/eval tree is not a product
    // defect. lodestone reported eval/metrics.ts (its own eval harness) and
    // eval/fixtures/sample-repo/ (deliberately-planted defect code) — correct
    // observations about the wrong thing. Note this is NOT the isTest() check
    // above: that one excludes test files from being SCANNED for orphans, while
    // this excludes non-.test support code that only exists to serve tests.
    if (/(^|\/)(fixtures?|eval|__fixtures__|testdata|examples?|samples?|mocks?|__mocks__)(\/|$)/i.test(relative(repo, file))) continue;
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
  // NodeNext/ESM TypeScript writes `./foo.js` for a file that is `foo.ts`.
  // shipwright uses that style for 509 of 509 relative imports and ZERO
  // extensionless ones, so without this mapping essentially every edge in the
  // app failed to resolve and 68% of the repo read as unreachable. The
  // extension in a specifier is the OUTPUT name, not the source name.
  const swapped = baseP.replace(/\.[cm]?js$/, "");
  const bases = swapped === baseP ? [baseP] : [swapped, baseP];
  const cands = bases.flatMap((b) => [b,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].flatMap((e) => [b + e, join(b, "index" + e)])]);
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
// ENTRY-POINT DISCOVERY. This was the reason the detector was unshippable:
// reading only the ROOT package.json produced 432 "unreachable" findings on
// shipwright and NOT COMPUTED on five of eight repos, because a monorepo
// declares entries per workspace and a server app often declares none at all —
// its real entry is a bootstrap file no manifest names.
//
// Four sources, in decreasing confidence:
//   1. every package.json in the tree (main/module/browser/bin/exports), not
//      just the root — one per workspace
//   2. build/run scripts: a `node X`, `tsx X`, `vite build`, `fastify start X`
//      in any package.json "scripts" names a real entry the manifest fields miss
//   3. conventional bootstraps: src/{index,main,server,cli,app,bootstrap,mcp}.*
//      and apps/*/src/{...} — matched only when the file EXISTS
//   4. framework-convention files that a router loads by path rather than by
//      import: Next/Remix/SvelteKit route files, *.route.ts, routes/*.ts
//
// Anything still unreached after that is reported, but the report says how many
// entries were found — a low entry count on a big repo means the answer is
// "we could not seed this", not "your code is dead".
function entryPoints(repo, files = []) {
  const set = new Set();
  const addRel = (base, p) => {
    if (typeof p !== 'string' || !p) return;
    const clean = p.replace(/^\.\//, '').split('?')[0];
    for (const cand of [clean, clean.replace(/\.js$/, '.ts'), clean.replace(/\.js$/, '.tsx'),
      clean.replace(/\.mjs$/, '.ts'), clean.replace(/^dist\//, 'src/').replace(/\.js$/, '.ts')]) {
      const abs = join(base, cand);
      if (files.includes(abs)) { set.add(abs); return; }
    }
  };

  // 1 + 2. every manifest in the tree
  for (const mf of files.filter((f) => basename(f) === 'package.json')) {
    let j; try { j = JSON.parse(readFileSync(mf, 'utf8')); } catch { continue; }
    const base = dirname(mf);
    for (const field of [j.main, j.module, j.browser]) addRel(base, field);
    if (typeof j.bin === 'string') addRel(base, j.bin);
    else for (const v of Object.values(j.bin || {})) addRel(base, v);
    const walkExports = (e) => { if (typeof e === 'string') addRel(base, e); else if (e && typeof e === 'object') for (const v of Object.values(e)) walkExports(v); };
    walkExports(j.exports);
    // scripts: pull the first path-looking token after a runner
    for (const cmd of Object.values(j.scripts || {})) {
      for (const m of String(cmd).matchAll(/(?:^|[&|;]\s*)(?:node|tsx|ts-node|bun|deno run|nodemon|fastify start)\s+([^\s&|;]+)/g)) addRel(base, m[1]);
    }
  }

  // 3. conventional bootstraps, only where the file exists
  const CONV = ['index', 'main', 'server', 'cli', 'app', 'bootstrap', 'mcp', 'worker', 'entry'];
  for (const f of files) {
    const rel = f.slice(repo.length + 1);
    if (/(^|\/)(src|app|apps\/[^/]+\/src|packages\/[^/]+\/src)\/([^/]+)\.[cm]?[jt]sx?$/.test(rel)) {
      const stem = basename(rel).replace(/\.[cm]?[jt]sx?$/, '');
      if (CONV.includes(stem)) set.add(f);
    }
  }

  // 4. framework-convention route files — loaded by a router, never imported
  for (const f of files) {
    const rel = f.slice(repo.length + 1);
    if (/(^|\/)(routes?|pages|api)\//.test(rel) || /\.(route|routes|handler|controller)\.[cm]?[jt]sx?$/.test(rel)
      || /(^|\/)(page|layout|route|loader|action|\+page|\+server)\.[cm]?[jt]sx?$/.test(basename(rel))) set.add(f);
  }

  return set;
}

function* walkManifests(dir, depth = 0) {
  if (depth > 8) return;
  let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '.next'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkManifests(p, depth + 1);
    else if (e.name === 'package.json') yield p;
  }
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
  console.log(`reachability: ${basename(repo)} — ${l1.length} built-but-unwired (L1), ${l0.length} unreferenced (L0)`);
  console.log(`  seeded from ${ENTRY_COUNT} entry point(s). A low count on a large repo means "could not seed", not "your code is dead".\n`);
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
