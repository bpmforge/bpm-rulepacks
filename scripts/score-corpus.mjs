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
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

// ±2 by default: engines and labels legitimately disagree by an import line or
// a wrapped call. SCORE_LINE_TOLERANCE exists for sensitivity analysis — a
// finding count that collapses at tolerance 0 was riding on the fuzz, and
// "N false positives" should never rest on a number nobody has stress-tested.
// Declared here, not beside lineNear() in the helpers block: the matching loop
// runs at module top level, so a const declared below it is still in its TDZ.
const LINE_TOLERANCE = Number(process.env.SCORE_LINE_TOLERANCE ?? 2);

// Engine resolution (opengrep preferred, semgrep fallback) — same policy as the fleet.
const engine = ['opengrep', 'semgrep'].find(have);
if (!engine) skip('no SAST engine (opengrep/semgrep) installed');

const corpusPath = join(CORPUS_DIR, name);
if (!existsSync(corpusPath)) skip(`corpus '${name}' not fetched — run: node corpus/fetch.mjs ${name}`);

const labelsPath = valOf('--labels') || join(ROOT, 'corpus', 'labels', `${name}.json`);
if (!existsSync(labelsPath)) skip(`no labels for '${name}' at ${labelsPath} (write an adapter first)`);

function have(bin) { try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; } catch { return false; } }

// 1. Run the engine → SARIF
console.log(`scoring '${name}' with ${engine} over ${corpusPath} ...`);
let sarif;
try {
  // --metrics=off is a semgrep flag; opengrep doesn't accept it (and doesn't phone home by default).
  const scanArgs = ['scan', '--config', join(ROOT, 'packs'), '--sarif',
    ...(engine === 'semgrep' ? ['--metrics=off'] : []), corpusPath];
  const out = execFileSync(engine, scanArgs,
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

// 2b. ALSO run the ast-grep ruleset (the majority of the corpus). score-corpus
// previously only scanned packs/ (opengrep), making every astgrep/ rule invisible
// to corpus baselines. Run all astgrep/ rules via a temp sgconfig and merge findings.
if (have('ast-grep') && existsSync(join(ROOT, 'astgrep'))) {
  const cweById = buildAstGrepCweMap(join(ROOT, 'astgrep'));
  const sgDir = mkdtempSync(join(tmpdir(), 'bpm-sgconf-'));
  writeFileSync(join(sgDir, 'sgconfig.yml'), `ruleDirs:\n  - ${join(ROOT, 'astgrep')}\n`);
  try {
    const out = execFileSync('ast-grep', ['scan', '-c', join(sgDir, 'sgconfig.yml'), '--json', corpusPath],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    for (const m of JSON.parse(out || '[]')) {
      const ruleId = m.ruleId || m.rule_id || '';
      findings.push({ file: base(m.file || ''), line: m.range?.start?.line != null ? m.range.start.line + 1 : null, cwe: cweById[ruleId] || [], ruleId });
    }
  } catch (e) {
    try { for (const m of JSON.parse(e.stdout || '[]')) { const ruleId = m.ruleId || m.rule_id || ''; findings.push({ file: base(m.file || ''), line: m.range?.start?.line != null ? m.range.start.line + 1 : null, cwe: cweById[ruleId] || [], ruleId }); } }
    catch { console.error(`ast-grep pass failed: ${e.message.split('\n')[0]}`); }
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
  // FP attribution depends on how precise the safe label is, because the two
  // kinds of "safe" label assert different things:
  //
  //   LINE-level safe label (Juliet: 7844/7844 carry a line; juice-shop 74/74)
  //     = "this line is correct code". A finding there is a false positive
  //       whatever weakness it claims. NO CWE gate — gating here would erase
  //       real evidence: mem-unsafe-string-functions' 700 strcpy-in-good()
  //       hits on Juliet are honest FPs, and CWE-gating them restored the
  //       precision=1.000 ARTIFACT that recovering Juliet's safe labels was
  //       specifically meant to destroy.
  //
  //   FILE-level safe label (OWASP Benchmark: 0/1325 carry a line)
  //     = "this file does not contain CWE-X". Since lineNear(null, x) is true,
  //       an ungated match charges EVERY finding anywhere in the file as an FP
  //       for a weakness the label says nothing about. That is how one CWE-390
  //       code-health rule (bpm-slop-empty-catch-java) dropped this corpus's
  //       security precision 0.894 -> 0.793 while every security rule's tp/fp
  //       stayed byte-identical. Its 75 "false positives" were genuine empty
  //       catch blocks in files whose ground truth only says "not vulnerable
  //       to CWE-22". So: CWE gate applies, and only there.
  const hitSafe = safe.find((l) => base(l.file) === f.file && lineNear(l.line, f.line)
    && (l.line != null || cweOverlap(l.cwe, f.cwe)));
  if (hitSafe) { fp++; r.fp++; continue; }
  // Counted separately, never hidden: a cross-taxonomy hit lands on a labeled
  // file but reports a different weakness class.
  //
  // NOTE the hole this opens and how it is closed: cweOverlap() returns false
  // when EITHER side is empty, so on a file-level-labeled corpus a rule with no
  // metadata.cwe would never be charged a false positive — every finding would
  // route here instead. "Omit the cwe: tag" would be a way to opt out of FP
  // accounting. validate-provenance.mjs therefore REQUIRES a non-empty cwe: on
  // every rule (`npm run check`), which is what makes that impossible rather
  // than merely unobserved.
  //
  // crossTaxonomy is recorded for triage; it is NOT gated on. gate-corpus.mjs
  // compares precision/recall only, so a rule sitting at 0 TP with a large
  // crossTaxonomy count (a07-hardcoded-connection-string-vbnet: 0/503 on
  // Juliet) is visible in the emitted JSON but fails nothing. Deliberate — it
  // is a triage signal, not an accounting ledger.
  const onLabeledFile = safe.some((l) => base(l.file) === f.file) || vuln.some((l) => base(l.file) === f.file);
  if (onLabeledFile) r.crossTaxonomy = (r.crossTaxonomy || 0) + 1;
  else r.unlabeled = (r.unlabeled || 0) + 1;
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

// --emit writes the CURRENT result (including perRule) somewhere harmless, so a
// regression can be diffed rule-by-rule against the committed baseline without
// overwriting it. Triaging a red gate previously required --update-baseline,
// i.e. destroying the evidence to look at it.
const emitPath = valOf('--emit');
if (emitPath) {
  writeFileSync(emitPath, JSON.stringify(current, null, 2) + '\n');
  console.log(`  current result → ${emitPath} (baseline untouched)`);
}

if (updateBaseline) {
  mkdirSync(baseDir, { recursive: true });
  writeFileSync(basePath, JSON.stringify(current, null, 2) + '\n');
  console.log(`  baseline written → corpus/baselines/${name}.json`);
}

process.exit(regressed && !updateBaseline ? 1 : 0);

// ── helpers ──
function base(p) { return String(p).split('/').slice(-2).join('/'); }
// Map each ast-grep rule id → its metadata.cwe (so ast-grep findings can match labels by CWE).
function buildAstGrepCweMap(dir) {
  const map = {};
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.ya?ml$/.test(e.name)) {
        const t = readFileSync(p, 'utf8');
        const id = t.match(/^id:\s*(\S+)/m)?.[1];
        if (!id) continue;
        const cweLine = t.match(/^\s*cwe:\s*\[([^\]]*)\]/m)?.[1] || '';
        map[id] = cweLine.split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean);
      }
    }
  };
  try { walk(dir); } catch { /* no astgrep dir */ }
  return map;
}
function labelKey(l) { return `${base(l.file)}:${l.line ?? '*'}:${(l.cwe || []).join(',')}`; }
function lineNear(a, b) { if (a == null || b == null) return true; return Math.abs(a - b) <= LINE_TOLERANCE; }
function cweOverlap(a, b) { const A = arr(a), B = arr(b); return A.length === 0 || B.length === 0 ? false : A.some((x) => B.includes(x)); }
function arr(x) { return (Array.isArray(x) ? x : x == null ? [] : [x]).map((n) => String(n).replace(/^CWE-?/i, '')); }
function cweOfRuleFilter() { return true; }
function extractCwe(res, ruleMeta) {
  const tags = ruleMeta?.properties?.tags || [];
  // Our rules emit `metadata.cwe: [798]`, which semgrep/opengrep flatten into the
  // SARIF tag list as either "CWE-798" or a bare "798" — accept both, plus any
  // explicit CWE reference in the message. A bare 1-4 digit tag is a CWE number.
  const fromTags = tags
    .filter((t) => /^cwe-?\d+$/i.test(t) || /^\d{1,4}$/.test(t))
    .map((t) => t.replace(/^CWE-?/i, ''));
  const fromMsg = (res.message?.text || '').match(/CWE-?(\d+)/gi)?.map((m) => m.replace(/^CWE-?/i, '')) || [];
  return [...new Set([...fromTags, ...fromMsg].map((s) => String(s).replace(/\D/g, '')).filter(Boolean))];
}
function fmt(x) { return x == null ? 'n/a' : x.toFixed(3); }
function sign(x) { return (x >= 0 ? '+' : '') + x.toFixed(3); }
