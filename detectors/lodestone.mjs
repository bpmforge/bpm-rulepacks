#!/usr/bin/env node
// Adapter over Lodestone's symbol-graph metrics. Seven detector classes, none of
// them ours to maintain.
//
//   node detectors/lodestone.mjs <repo> [--sarif] [--only a,b]
//
// WHY THIS REPLACED TWO OF OUR OWN DETECTORS. Lodestone already exported
// computeDeadCode, computeDuplication and computePhantomImports before we wrote
// detectors/reachability.mjs, detectors/duplication.mjs and the phantom-import
// half of detectors/manifest.mjs. All three of ours were worse:
//
//   - reachability.mjs worked at FILE level. Lodestone works at SYMBOL level via
//     tree-sitter defs/refs/calls across 12 languages, with per-language
//     confidence tiers reflecting whether that grammar's refs are cross-file
//     capable. On quarry Lodestone finds BOTH round-1 LLM findings —
//     decoders.ts dead in production AND resetForTests never called — where the
//     file-level version found only the first.
//   - duplication.mjs hashed normalised function bodies. Lodestone uses a
//     Rabin-Karp rolling hash over a language-aware token stream.
//
// Building them without checking was library-shaped reimplementation — R-30,
// the exact anti-slop rule this repo ships detectors for. Recorded because the
// lesson is more useful than the code was.
//
// FOUR CLASSES WE NEVER HAD, now available for free:
//   computeUntestedSurface    the "untested exports" cluster that sat in the
//                             backlog for three rounds marked BLOCKED
//   computeSingleUseHelper    ANTI_SLOP R-07
//   computeSingleImplementation  ANTI_SLOP R-05
//   computeCouplingOutliers   calls/imports graph outliers
//
// DEPENDENCY POSTURE. Lodestone is private and unpublished, so it is treated
// exactly like opengrep and ast-grep: an external engine, resolved at runtime,
// SKIPPED loudly when absent. bpm-rulepacks stays installable and zero-dep
// without it. Set LODESTONE_DIR to override the default path.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, realpathSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: lodestone.mjs <repo> [--sarif] [--only a,b]'); process.exit(2); }
if (!existsSync(target)) { console.error(`no such path: ${target}`); process.exit(2); }
const repo = realpathSync(target);

const LODE = process.env.LODESTONE_DIR || join(process.env.HOME, 'Code', 'lodestone');
const LIB = join(LODE, 'dist', 'lib.js');
const SARIF = argv.includes("--sarif");
// FILE-COUNT CEILING. This adapter reads and tree-sitter-parses every source
// file, so it is minutes on a large tree — and score-corpus.mjs runs detectors
// on every gate. Left ungated it would run over juliet-cpp's 64,099 files on
// every push and destroy the 29-second pre-push property the whole local gate
// depends on. Above the ceiling it SKIPS and says so, which is honest; it never
// reports zero.
const MAX_FILES = Number(process.env.LODESTONE_MAX_FILES ?? 3000);

// TOOL_PREFLIGHT: a missing engine SKIPs loudly. It never reports zero findings,
// which would read as a clean bill of health it never earned — the same
// discipline as the fixture runner and the corpus gate's exit-3.
if (!existsSync(LIB)) {
  const msg = `SKIP  lodestone not built at ${LIB} — run \`npm run build\` there, or set LODESTONE_DIR`;
  if (SARIF) { console.error(msg); console.log(JSON.stringify({ version: '2.1.0', runs: [] })); }
  else console.log(msg);
  process.exit(0);
}

// Each metric maps to a rule id, a CWE, and the review domain it answers, so
// differential.mjs can attribute a match to the right detector rather than to
// whichever one happens to share a line.
const METRICS = {
  deadCode: { fn: 'computeDeadCode', id: 'LODE-DEAD-CODE', cwe: '561', domain: 'slop' },
  duplication: { fn: 'computeDuplication', id: 'LODE-DUPLICATION', cwe: '1041', domain: 'slop' },
  phantomImports: { fn: 'computePhantomImports', id: 'LODE-PHANTOM-IMPORT', cwe: '1104', domain: 'slop' },
  untestedSurface: { fn: 'computeUntestedSurface', id: 'LODE-UNTESTED-SURFACE', cwe: '1120', domain: 'codehealth' },
  singleUseHelper: { fn: 'computeSingleUseHelper', id: 'LODE-SINGLE-USE-HELPER', cwe: '1121', domain: 'slop' },
  singleImplementation: { fn: 'computeSingleImplementation', id: 'LODE-SINGLE-IMPL', cwe: '1121', domain: 'slop' },
  couplingOutliers: { fn: 'computeCouplingOutliers', id: 'LODE-COUPLING-OUTLIER', cwe: '1047', domain: 'codehealth' },
};
const onlyArg = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',').map((s) => s.trim()) : null;
const wanted = Object.entries(METRICS).filter(([k]) => !onlyArg || onlyArg.includes(k));

// The driver runs inside Lodestone's own directory so its built dist/ and native
// deps resolve. Written to a temp file rather than passed as -e: the code is long
// enough that shell quoting becomes its own failure mode.
const driver = `
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const LIB = ${JSON.stringify(LIB)};
const repo = ${JSON.stringify(repo)};
const wanted = ${JSON.stringify(wanted.map(([k, v]) => [k, v.fn]))};
const mod = await import(LIB);

const SKIP = new Set(['node_modules','.git','dist','build','coverage','.next','out','vendor','.worktrees','.claude']);
const EXT = /\\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|cs|rb|php|c|cpp|h|hpp)$/;
function* walk(dir, depth = 0) {
  if (depth > 12) return;
  let e; try { e = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const x of e) {
    if (SKIP.has(x.name)) continue;
    const p = join(dir, x.name);
    if (x.isDirectory()) yield* walk(p, depth + 1);
    else if (EXT.test(x.name) && !/\\.d\\.ts$/.test(x.name)) yield p;
  }
}
const files = [];
for (const abs of walk(repo)) {
  try { if (statSync(abs).size > 2_000_000) continue;
    files.push({ path: relative(repo, abs), content: readFileSync(abs, 'utf8') }); } catch {}
}
const out = { files: files.length, metrics: {}, unavailable: [], overCeiling: false };
if (files.length > ${MAX_FILES}) {
  out.overCeiling = true;
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}
for (const [key, fnName] of wanted) {
  const fn = mod[fnName];
  if (typeof fn !== 'function') { out.unavailable.push(key); continue; }
  try { out.metrics[key] = await fn(files); }
  catch (e) { out.unavailable.push(key + ': ' + String(e && e.message).split('\\n')[0]); }
}
process.stdout.write(JSON.stringify(out));
`;
const tmp = join(mkdtempSync(join(tmpdir(), 'bpm-lode-')), 'drive.mjs');
writeFileSync(tmp, driver);

let result;
try {
  const out = execFileSync('node', [tmp], { cwd: LODE, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  result = JSON.parse(out);
} catch (e) {
  const msg = `SKIP  lodestone driver failed: ${String(e.message).split('\n')[0]}`;
  if (SARIF) { console.error(msg); console.log(JSON.stringify({ version: '2.1.0', runs: [] })); }
  else console.log(msg);
  process.exit(0);
}

if (result.overCeiling) {
  const msg = `SKIP  lodestone: ${result.files} files exceeds the ${MAX_FILES}-file ceiling (LODESTONE_MAX_FILES to raise). NOT zero findings — unrun.`;
  if (SARIF) { console.error(msg); console.log(JSON.stringify({ version: "2.1.0", runs: [] })); }
  else console.log(msg);
  process.exit(0);
}

// Each metric returns its own record shape; normalise on the fields they share.
const loc = (f) => ({ path: f.path ?? f.file ?? f.filePath ?? '', line: f.line ?? f.startLine ?? f.start?.line ?? 1 });
const label = (f) => f.symbol ?? f.name ?? f.module ?? f.specifier ?? '';
const detail = (f) => f.reason ?? f.detail ?? f.message ?? '';

const rows = [];
for (const [key, meta] of wanted) {
  for (const f of (result.metrics[key] || [])) {
    const { path, line } = loc(f);
    if (!path) continue;
    rows.push({ key, meta, path, line, label: label(f), detail: detail(f), confidence: f.confidence ?? null, raw: f });
  }
}

if (SARIF) {
  const ids = [...new Set(rows.map((r) => r.meta.id))];
  console.log(JSON.stringify({ version: '2.1.0', runs: [{
    tool: { driver: { name: 'lodestone-metrics', rules: ids.map((id) => {
      const m = Object.values(METRICS).find((x) => x.id === id);
      return { id, properties: { tags: [`CWE-${m.cwe}`], domain: m.domain } };
    }) } },
    results: rows.map((r) => ({
      ruleId: r.meta.id,
      level: r.confidence === 'low' ? 'note' : 'warning',
      message: { text: `${r.label ? `"${r.label}" — ` : ''}${r.detail || r.key}` },
      properties: { tags: [`CWE-${r.meta.cwe}`], domain: r.meta.domain, confidence: r.confidence ?? undefined },
      locations: [{ physicalLocation: { artifactLocation: { uri: join(repo, r.path) }, region: { startLine: Number(r.line) || 1 } } }],
    })),
  }] }));
  process.exit(0);
}

console.log(`lodestone metrics: ${basename(repo)} — ${result.files} files scanned\n`);
console.log('| metric | findings | high-confidence |');
console.log('|---|---|---|');
for (const [key] of wanted) {
  const mine = rows.filter((r) => r.key === key);
  const hi = mine.filter((r) => r.confidence !== 'low').length;
  console.log(`| ${key} | ${mine.length} | ${mine.some((r) => r.confidence) ? hi : '—'} |`);
}
if (result.unavailable.length) {
  // Never silent: an export that moved or threw is reported, not counted as zero.
  console.log(`\n⚠ ${result.unavailable.length} metric(s) UNAVAILABLE — not zero, unrun:`);
  for (const u of result.unavailable) console.log(`    ${u}`);
}
console.log();
for (const [key] of wanted) {
  const mine = rows.filter((r) => r.key === key).slice(0, 5);
  if (!mine.length) continue;
  console.log(`  ${key}:`);
  for (const r of mine) console.log(`    ${r.path}:${r.line}  ${r.label}${r.confidence === 'low' ? '  (low confidence)' : ''}`);
}
