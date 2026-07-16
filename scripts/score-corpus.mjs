#!/usr/bin/env node
// Tier-2 corpus scoring: run the SAST engine over a fetched labeled corpus,
// match findings to ground-truth labels by (file, line, CWE), and emit
// precision/recall/F1 per pack and per rule, with a regression diff vs baseline.
//
// Corpus-agnostic: reads a normalized labels file (corpus/labels/<name>.json),
// so adding a corpus is just an adapter that produces that file — this scorer
// never changes. TOOL_PREFLIGHT discipline: if the engine or corpus is absent,
// it SKIPs loudly (exit 0, reports "skipped") rather than reporting a false clean.
//
// Usage:
//   node scripts/score-corpus.mjs <corpus-name> [--rule <id>] [--update-baseline] [--threshold 0.05]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const ruleFilter = valOf('--rule');
const updateBaseline = args.includes('--update-baseline');
const threshold = parseFloat(valOf('--threshold') || '0.05');
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');

function valOf(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; }
function skip(msg) { console.log(`SKIP  ${msg}`); process.exit(0); }

if (!name) { console.error('usage: score-corpus.mjs <corpus-name> [--rule id] [--update-baseline]'); process.exit(2); }

// Engine resolution (opengrep preferred, semgrep fallback) — same policy as the fleet.
const engine = ['opengrep', 'semgrep'].find(have);
if (!engine) skip('no SAST engine (opengrep/semgrep) installed');

const corpusPath = join(CORPUS_DIR, name);
if (!existsSync(corpusPath)) skip(`corpus '${name}' not fetched — run: node corpus/fetch.mjs ${name}`);

const labelsPath = join(ROOT, 'corpus', 'labels', `${name}.json`);
if (!existsSync(labelsPath)) skip(`no labels for '${name}' at corpus/labels/${name}.json (write an adapter first)`);

function have(bin) { try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; } catch { return false; } }

// 1. Run the engine → SARIF
console.log(`scoring '${name}' with ${engine} over ${corpusPath} ...`);
let sarif;
try {
  const out = execFileSync(engine, ['scan', '--config', join(ROOT, 'packs'), '--sarif', '--metrics=off', corpusPath],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  sarif = JSON.parse(out);
} catch (e) {
  // engine exits 1 when findings exist — its stdout is still valid SARIF
  try { sarif = JSON.parse(e.stdout); } catch { console.error(`engine failed: ${e.message.split('\n')[0]}`); process.exit(1); }
}

// 2. Normalize findings → [{file, line, cwe, ruleId}]
const findings = [];
for (const run of sarif.runs || []) {
  const ruleMeta = Object.fromEntries((run.tool?.driver?.rules || []).map((r) => [r.id, r]));
  for (const res of run.results || []) {
    const loc = res.locations?.[0]?.physicalLocation;
    const file = loc?.artifactLocation?.uri?.replace(/^.*?\/([^/]+\/[^/]+)$/, '$1') || loc?.artifactLocation?.uri || '';
    const line = loc?.region?.startLine ?? null;
    const cwes = extractCwe(res, ruleMeta[res.ruleId]);
    findings.push({ file: base(file), line, cwe: cwes, ruleId: res.ruleId });
  }
}

// 3. Load normalized labels: [{file, line?, cwe, kind:"vuln"|"safe"}]
const labels = JSON.parse(readFileSync(labelsPath, 'utf8'));

// 4. Match. A finding is a TP if it lands on a vuln label with an overlapping CWE
//    (line-tolerant: ±2 lines, since engines and labels sometimes differ by an import line).
const vuln = labels.filter((l) => l.kind === 'vuln');
const safe = labels.filter((l) => l.kind === 'safe');
let tp = 0, fp = 0;
const matchedVuln = new Set();
const perRule = {};

for (const f of findings) {
  if (ruleFilter && f.ruleId !== ruleFilter) continue;
  const r = (perRule[f.ruleId] ??= { tp: 0, fp: 0 });
  const hitVuln = vuln.find((l) => base(l.file) === f.file && cweOverlap(l.cwe, f.cwe) && lineNear(l.line, f.line));
  if (hitVuln) { tp++; r.tp++; matchedVuln.add(labelKey(hitVuln)); continue; }
  const hitSafe = safe.find((l) => base(l.file) === f.file && lineNear(l.line, f.line));
  if (hitSafe) { fp++; r.fp++; continue; }
  // finding not on any labeled line: count as FP only in strict mode. Default: ignore
  // (unlabeled lines aren't ground truth either way), but track for review.
  r.unlabeled = (r.unlabeled || 0) + 1;
}
const consideredVuln = ruleFilter ? vuln.filter((l) => cweOfRuleFilter(l)) : vuln;
const fn = consideredVuln.filter((l) => !matchedVuln.has(labelKey(l))).length;

// 5. Metrics
const precision = tp + fp === 0 ? null : tp / (tp + fp);
const recall = tp + fn === 0 ? null : tp / (tp + fn);
const f1 = precision && recall ? (2 * precision * recall) / (precision + recall) : null;

console.log(`\n${name}: TP=${tp} FP=${fp} FN=${fn}`);
console.log(`  precision=${fmt(precision)}  recall=${fmt(recall)}  F1=${fmt(f1)}`);

// 6. Baseline diff / regression gate
const baseDir = join(ROOT, 'corpus', 'baselines');
const basePath = join(baseDir, `${name}.json`);
const current = { tp, fp, fn, precision, recall, f1, perRule };
let regressed = false;
if (existsSync(basePath)) {
  const prev = JSON.parse(readFileSync(basePath, 'utf8'));
  const dP = (precision ?? 0) - (prev.precision ?? 0);
  const dR = (recall ?? 0) - (prev.recall ?? 0);
  console.log(`  vs baseline: Δprecision=${sign(dP)}  Δrecall=${sign(dR)}`);
  if (dP < -threshold || dR < -threshold) { console.log(`  ⚠ REGRESSION (> ${threshold})`); regressed = true; }
} else {
  console.log('  (no baseline yet)');
}

if (updateBaseline) {
  mkdirSync(baseDir, { recursive: true });
  writeFileSync(basePath, JSON.stringify(current, null, 2) + '\n');
  console.log(`  baseline written → corpus/baselines/${name}.json`);
}

process.exit(regressed && !updateBaseline ? 1 : 0);

// ── helpers ──
function base(p) { return String(p).split('/').slice(-2).join('/'); }
function labelKey(l) { return `${base(l.file)}:${l.line ?? '*'}:${(l.cwe || []).join(',')}`; }
function lineNear(a, b) { if (a == null || b == null) return true; return Math.abs(a - b) <= 2; }
function cweOverlap(a, b) { const A = arr(a), B = arr(b); return A.length === 0 || B.length === 0 ? false : A.some((x) => B.includes(x)); }
function arr(x) { return (Array.isArray(x) ? x : x == null ? [] : [x]).map((n) => String(n).replace(/^CWE-?/i, '')); }
function cweOfRuleFilter() { return true; }
function extractCwe(res, ruleMeta) {
  const tags = ruleMeta?.properties?.tags || [];
  const fromTags = tags.filter((t) => /cwe/i.test(t)).map((t) => t.replace(/^CWE-?/i, ''));
  const fromMsg = (res.message?.text || '').match(/CWE-?(\d+)/gi)?.map((m) => m.replace(/^CWE-?/i, '')) || [];
  return [...new Set([...fromTags, ...fromMsg].map((s) => String(s).replace(/\D/g, '')).filter(Boolean))];
}
function fmt(x) { return x == null ? 'n/a' : x.toFixed(3); }
function sign(x) { return (x >= 0 ? '+' : '') + x.toFixed(3); }
