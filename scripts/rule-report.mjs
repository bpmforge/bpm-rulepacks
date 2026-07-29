#!/usr/bin/env node
// Everything mechanical about evaluating a rule, done by CPU. Zero tokens.
//
//   npm run report -- packs/owasp/a03-sql-string-concat.yaml
//   npm run report -- packs/secrets/hardcoded-credentials.yaml --snapshot
//   npm run report -- <rule.yaml> --md docs/reports/foo.md
//
// WHY THIS EXISTS. Three rule iterations in a row, an agent was asked to
// "run an FP sweep across real repos and classify every finding". Each one
// burned 150-230k tokens and 130-210 tool calls re-deriving the same procedure:
// copy the old rule to a temp file, scan N repos twice, diff the counts, print a
// table. That is not judgment — it is a loop over a list. The only step that
// genuinely needs a reader is deciding whether a given finding is real, and this
// script does everything up to that line and then stops.
//
// It also does the one comparison that kept getting done by hand and is easy to
// get wrong: the FP DELTA. `--snapshot` records the current findings per repo;
// the next run diffs against it and shows exactly which findings a rule change
// ADDED and REMOVED. Widening a rule without that number is guesswork — the
// camelCase secrets change looked harmless and added 44 findings with zero
// genuine ones.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const rulePath = argv.find((a) => !a.startsWith('--'));
if (!rulePath) {
  console.error('usage: rule-report.mjs <rule.yaml> [--snapshot] [--md <file>] [--repos a,b]');
  process.exit(2);
}
const ruleFile = rulePath.startsWith('/') ? rulePath : join(ROOT, rulePath);
if (!existsSync(ruleFile)) { console.error(`no such rule file: ${ruleFile}`); process.exit(2); }

const ruleText = readFileSync(ruleFile, 'utf8');
const ruleIds = [...ruleText.matchAll(/^\s*-?\s*id:\s*(\S+)/gm)].map((m) => m[1]);
const slug = basename(ruleFile).replace(/\.ya?ml$/, '');
const isAstGrep = ruleFile.includes('/astgrep/');

// Repo list: committed defaults, overridable. A repo that is absent is reported
// MISSING, never skipped silently — a sweep that scanned three of six repos and
// printed "0 findings" would read as a clean bill of health it never earned.
const cfgPath = join(ROOT, 'scripts', 'sweep-repos.json');
const repos = (argv.includes('--repos')
  ? argv[argv.indexOf('--repos') + 1].split(',')
  : (existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')).repos : [])
).map((r) => r.replace(/^~/, process.env.HOME));

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say(`# Rule report — ${slug}`);
say();
say(`Rule id(s): ${ruleIds.join(', ') || '(none parsed)'}`);
say(`Engine: ${isAstGrep ? 'ast-grep' : 'opengrep'}`);
say();

// ── 1. Fixtures ─────────────────────────────────────────────────────────────
say('## Fixtures');
say();
const fx = run('node', ['scripts/test-rules.mjs', '--only', `${packOf(ruleFile)}/${slug}`]);
const fxSummary = (fx.match(/^\d+ passed.*$/m) || ['(no fixtures matched)'])[0];
say('```');
say(fx.split('\n').filter((l) => /^(PASS|FAIL|SKIP|\d+ passed)/.test(l)).join('\n') || fxSummary);
say('```');
if (/FAIL/.test(fx)) say('**FIXTURES FAILING — nothing below is meaningful until this is green.**');
if (/no fixtures matched/.test(fx) || /^0 passed/m.test(fx)) {
  say('**NO FIXTURE PAIR FOR THIS RULE.** A rule with no RED/GREEN pair is unverified.');
}
say();

// ── 2. Corpus contribution ──────────────────────────────────────────────────
say('## Corpus contribution');
say();
say('| Corpus | TP | FP | crossTax | unlabeled |');
say('|---|---|---|---|---|');
const baselineDir = join(ROOT, 'corpus', 'baselines');
for (const f of existsSync(baselineDir) ? readdirSync(baselineDir).filter((x) => x.endsWith('.json')) : []) {
  const corpus = f.replace(/\.json$/, '');
  const tmp = join(ROOT, `.rule-report-${process.pid}.json`);
  const r = run('node', ['scripts/score-corpus.mjs', corpus, '--emit', tmp]);
  if (/^SKIP\b/m.test(r) || !existsSync(tmp)) { say(`| ${corpus} | — | — | — | not fetched |`); continue; }
  const res = JSON.parse(readFileSync(tmp, 'utf8'));
  try { execFileSync('rm', ['-f', tmp]); } catch { /* tmp */ }
  const mine = Object.entries(res.perRule).filter(([k]) => ruleIds.some((id) => k.endsWith(id)));
  if (!mine.length) { say(`| ${corpus} | 0 | 0 | 0 | 0 |`); continue; }
  const sum = (k) => mine.reduce((n, [, v]) => n + (v[k] || 0), 0);
  say(`| ${corpus} | ${sum('tp')} | ${sum('fp')} | ${sum('crossTaxonomy')} | ${sum('unlabeled')} |`);
}
say();

// ── 3. FP sweep over real repositories ──────────────────────────────────────
say('## Sweep over real repositories');
say();
const findings = {};
let missing = 0;
for (const repo of repos) {
  if (!existsSync(repo)) { findings[repo] = null; missing++; continue; }
  findings[repo] = scan(repo);
}
say('| Repo | Findings |');
say('|---|---|');
for (const [repo, list] of Object.entries(findings)) {
  say(`| ${basename(repo)} | ${list === null ? '**MISSING — not scanned**' : list.length} |`);
}
if (missing) say(`\n**${missing} repo(s) missing. Those are UNSWEPT, not clean.**`);
say();

const total = Object.values(findings).filter(Boolean).reduce((n, l) => n + l.length, 0);
if (total) {
  say('### Every finding, for triage');
  say();
  say('Mark each: genuine / false positive / unclear. This is the only step a');
  say('script cannot do — everything above it is mechanical.');
  say();
  say('| Repo | Location | Matched line |');
  say('|---|---|---|');
  for (const [repo, list] of Object.entries(findings)) {
    for (const f of list || []) {
      say(`| ${basename(repo)} | \`${f.file}:${f.line}\` | \`${f.text.slice(0, 90).replace(/\|/g, '\\|')}\` |`);
    }
  }
  say();
}

// ── 4. Delta vs the last snapshot ───────────────────────────────────────────
const snapDir = join(ROOT, '.sweeps');
const snapPath = join(snapDir, `${slug}.json`);
const key = (repo, f) => `${basename(repo)}|${f.file}:${f.line}`;
const current = new Set();
for (const [repo, list] of Object.entries(findings)) for (const f of list || []) current.add(key(repo, f));

if (existsSync(snapPath)) {
  const prev = new Set(JSON.parse(readFileSync(snapPath, 'utf8')).findings);
  const added = [...current].filter((k) => !prev.has(k));
  const removed = [...prev].filter((k) => !current.has(k));
  say('## Delta vs last snapshot');
  say();
  say(`Previous: ${prev.size}   Current: ${current.size}   **+${added.length} / -${removed.length}**`);
  say();
  if (added.length) { say('**ADDED by the current rule text:**'); say(); for (const k of added) say(`- \`${k}\``); say(); }
  if (removed.length) { say('**REMOVED:**'); say(); for (const k of removed) say(`- \`${k}\``); say(); }
  if (!added.length && !removed.length) say('No change.');
  say();
} else {
  say('_No previous snapshot. Run with `--snapshot` to record one; the next run will show the delta._');
  say();
}

if (argv.includes('--snapshot')) {
  mkdirSync(snapDir, { recursive: true });
  writeFileSync(snapPath, JSON.stringify({ rule: slug, ruleIds, findings: [...current] }, null, 2) + '\n');
  console.log(`\nsnapshot written → .sweeps/${slug}.json`);
}

const mdIdx = argv.indexOf('--md');
if (mdIdx >= 0 && argv[mdIdx + 1]) {
  mkdirSync(dirname(argv[mdIdx + 1]), { recursive: true });
  writeFileSync(argv[mdIdx + 1], out.join('\n') + '\n');
  console.log(`\nreport written → ${argv[mdIdx + 1]}`);
}

// ── helpers ─────────────────────────────────────────────────────────────────
function packOf(p) { const m = p.match(/\/(packs|astgrep)\/([^/]+)\//); return m ? m[2] : ''; }
function run(cmd, args) {
  const r = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] , shell: false });
  return r;
}
function scan(repo) {
  const list = [];
  try {
    if (isAstGrep) {
      const o = execFileSync('ast-grep', ['scan', '--rule', ruleFile, '--json', repo],
        { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
      for (const m of JSON.parse(o || '[]')) list.push({ file: rel(m.file, repo), line: (m.range?.start?.line ?? 0) + 1, text: (m.lines || '').trim() });
    } else {
      const o = execFileSync('opengrep', ['scan', '--config', ruleFile, '--json', repo],
        { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
      for (const m of (JSON.parse(o).results || [])) list.push({ file: rel(m.path, repo), line: m.start.line, text: (m.extra?.lines || '').trim() });
    }
  } catch (e) {
    // opengrep exits 1 when findings exist; its stdout is still valid.
    try {
      for (const m of (JSON.parse(e.stdout).results || [])) list.push({ file: rel(m.path, repo), line: m.start.line, text: (m.extra?.lines || '').trim() });
    } catch { return []; }
  }
  // Dedupe on file:line — a taint rule reports one finding per source→sink path,
  // and three paths to one line is one thing to look at, not three.
  const seen = new Set();
  return list.filter((f) => { const k = `${f.file}:${f.line}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
function rel(p, repo) { return String(p).startsWith(repo) ? String(p).slice(repo.length + 1) : String(p); }
