#!/usr/bin/env node
// Differential harness — CPU tier vs LLM tier over the same repository.
//
//   node scripts/differential.mjs <repo> --llm <findings.sarif>
//   node scripts/differential.mjs <repo> --llm <f.sarif> --md report.md
//
// Three buckets, and the middle one is the entire point:
//
//   BOTH        stop paying the LLM for this class — it is covered
//   LLM ONLY    the MECHANIZATION BACKLOG. The output that matters.
//   CPU ONLY    either a CPU false positive or an LLM recall gap. Both worth knowing.
//
// THE GATE, restated here because it is the mistake that would waste the most
// work: the LLM is NOT ground truth. Shipwright's own dogfood produced 55
// findings -> 16 distinct claims -> 4 real. Eleven "CRITICAL" findings were one
// claim repeated by eleven specialists, and it was a false positive. Another
// cluster's recommended fix would have broken production. Mechanising the
// LLM-ONLY bucket without triage builds detectors for hallucinations and then
// scores them as recall. Every row in that bucket is a CANDIDATE.
//
// ── INPUT CONTRACT (the current blocker) ────────────────────────────────────
//
// The LLM side must be SARIF with a physical location: file + startLine.
// Matching is on (file, line ±2, CWE) — the same matcher score-corpus.mjs uses,
// deliberately, so "the CPU found it" means the same thing here as it does
// against a labeled corpus.
//
// AS OF 2026-07-29 THE EXPERT SYSTEM DOES NOT EMIT THIS. Checked against the
// real, fully-triaged Shipwright dogfood run
// (docs/dogfood/findings-tickets.json, 55 findings):
//
//     findings with a file:line reference ......  0 of 55
//     findings naming any file at all .......... 11 of 55  (bare basenames,
//                                                 e.g. "server.ts", no path)
//     findings with `evidence` populated .......  0 of 55
//
// The findings are prose recommendations. There is no key to join on, so the
// differential cannot be computed — not because the harness is missing, but
// because one side does not report WHERE. That is a change to the expert
// system's output contract, not to this repo, and it is the single
// prerequisite for measuring CPU-catch-rate on anything but a planted corpus.
//
// Until then this tool runs, and refuses to invent a match it cannot make.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, realpathSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const valOf = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const target = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--llm' && argv[argv.indexOf(a) - 1] !== '--md');
if (!target) { console.error('usage: differential.mjs <repo> --llm <findings.sarif> [--md out.md]'); process.exit(2); }

const repo = realpathSync(target);
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// ── CPU side ────────────────────────────────────────────────────────────────
const cpu = [];
try {
  const o = execFileSync('opengrep', ['scan', '--config', join(ROOT, 'packs'), '--sarif', repo],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  collect(JSON.parse(o), cpu);
} catch (e) { try { collect(JSON.parse(e.stdout), cpu); } catch { console.error('opengrep failed'); process.exit(1); } }
for (const det of ['manifest.mjs']) {
  const p = join(ROOT, 'detectors', det);
  if (!existsSync(p)) continue;
  try { collect(JSON.parse(execFileSync('node', [p, repo, '--sarif'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })), cpu); } catch { /* detector n/a */ }
}

// ── LLM side ────────────────────────────────────────────────────────────────
const llmPath = valOf('--llm');
if (!llmPath || !existsSync(llmPath)) {
  console.error(`\n--llm <findings.sarif> is required and must exist.\n`);
  console.error('The LLM side must be SARIF with file + startLine per finding.');
  console.error('The expert system does not currently emit locations — see this');
  console.error('file\'s header for the measured evidence. Without a location there');
  console.error('is no key to join on, and this tool will not guess one.');
  process.exit(2);
}
const llm = [];
collect(JSON.parse(readFileSync(llmPath, 'utf8')), llm);

const unlocatable = llm.filter((f) => !f.file || f.line == null).length;
say(`# Differential — ${basename(repo)}`);
say();
say(`CPU findings: ${cpu.length}   LLM findings: ${llm.length}`);
if (unlocatable) {
  say();
  say(`**${unlocatable} of ${llm.length} LLM findings carry no file/line and are EXCLUDED.**`);
  say('They are not "CPU missed them" — they are unjoinable. Counting them as');
  say('LLM-only would manufacture a mechanization backlog out of missing metadata.');
}
say();

const llmLoc = llm.filter((f) => f.file && f.line != null);
const near = (a, b) => Math.abs(a - b) <= 2;
const cweOverlap = (a, b) => a.length && b.length && a.some((x) => b.includes(x));

const both = [], llmOnly = [];
for (const l of llmLoc) {
  const hit = cpu.find((c) => same(c.file, l.file) && near(c.line, l.line) && (!l.cwe.length || !c.cwe.length || cweOverlap(c.cwe, l.cwe)));
  (hit ? both : llmOnly).push({ ...l, cpuRule: hit?.ruleId });
}
const cpuOnly = cpu.filter((c) => !llmLoc.some((l) => same(c.file, l.file) && near(c.line, l.line)));

const catchRate = llmLoc.length ? both.length / llmLoc.length : null;
say('| Bucket | Count | Meaning |');
say('|---|---|---|');
say(`| BOTH | ${both.length} | covered — stop paying the LLM for this class |`);
say(`| LLM ONLY | ${llmOnly.length} | **mechanization backlog (candidates, not spec)** |`);
say(`| CPU ONLY | ${cpuOnly.length} | CPU false positive *or* LLM recall gap |`);
say();
say(`**CPU-catch-rate: ${catchRate === null ? 'n/a' : (catchRate * 100).toFixed(1) + '%'}** (${both.length}/${llmLoc.length} locatable LLM findings)`);
say();
say('> CPU-catch-rate here is measured against UNTRIAGED LLM output. The real');
say('> KPI is against *triaged-real* findings only. Shipwright\'s dogfood went');
say('> 55 findings -> 16 claims -> 4 real; a catch-rate over the raw 55 would');
say('> flatter or damn us at random. Triage the LLM-only bucket first.');
say();

if (llmOnly.length) {
  say('## LLM-only — triage each before writing any detector');
  say();
  say('| Location | CWE | Finding |');
  say('|---|---|---|');
  for (const f of llmOnly) say(`| \`${f.file}:${f.line}\` | ${f.cwe.join('/') || '—'} | ${(f.message || '').replace(/\|/g, '\\|').slice(0, 110)} |`);
  say();
}
if (cpuOnly.length) {
  say('## CPU-only — check each against the LLM\'s miss before claiming recall');
  say();
  say('| Location | Rule |');
  say('|---|---|');
  for (const f of cpuOnly.slice(0, 60)) say(`| \`${f.file}:${f.line}\` | ${f.ruleId} |`);
  if (cpuOnly.length > 60) say(`| … | ${cpuOnly.length - 60} more |`);
  say();
}

const md = valOf('--md');
if (md) { mkdirSync(dirname(md), { recursive: true }); writeFileSync(md, out.join('\n') + '\n'); console.log(`\nreport → ${md}`); }

function collect(sarif, into) {
  for (const run of sarif.runs || []) {
    const meta = Object.fromEntries((run.tool?.driver?.rules || []).map((r) => [r.id, r]));
    for (const res of run.results || []) {
      const loc = res.locations?.[0]?.physicalLocation;
      into.push({
        ruleId: res.ruleId, file: rel(loc?.artifactLocation?.uri || ''),
        line: loc?.region?.startLine ?? null,
        cwe: cweOf(res, meta[res.ruleId]), message: res.message?.text || '',
      });
    }
  }
}
function cweOf(res, meta) {
  const tags = [...(meta?.properties?.tags || []), ...(res.properties?.tags || [])];
  const o = [];
  for (const t of tags) { const m = String(t).match(/CWE-?(\d+)/i); if (m) o.push(String(Number(m[1]))); }
  return o;
}
function rel(p) { const s = String(p).replace(/^file:\/\//, ''); return s.startsWith(repo) ? s.slice(repo.length + 1) : s; }
function same(a, b) {
  const A = String(a).split('/').filter(Boolean), B = String(b).split('/').filter(Boolean);
  const n = Math.min(A.length, B.length);
  if (!n) return false;
  for (let i = 1; i <= n; i++) if (A[A.length - i] !== B[B.length - i]) return false;
  return true;
}
