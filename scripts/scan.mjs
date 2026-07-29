#!/usr/bin/env node
// Run the full rulepack corpus over ANY repository — a local path or a git URL.
// This is the local, Actions-free answer to "point it at a code repository".
//
//   npm run scan -- ~/Code/shipwright
//   npm run scan -- https://github.com/some/repo --out /tmp/repo.sarif
//   npm run scan -- ~/Code/repopulse --pack owasp,secrets --top 30
//
// WHAT IT EMITS: a merged SARIF file plus a counts-by-rule summary.
//
// WHAT IT DELIBERATELY DOES NOT EMIT: precision, recall, or F1. An arbitrary
// repository carries no labels, so those numbers are undefined for it — they
// exist only in `npm run score`, against a corpus with committed ground truth.
// If this script ever printed a precision figure someone would quote it.
//
// Findings are not a failure: exit 0 even with hits, so this composes into a
// report pipeline. Use --fail-on-findings for a gate posture.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname;
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const valOf = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const target = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--out'
  && argv[argv.indexOf(a) - 1] !== '--pack' && argv[argv.indexOf(a) - 1] !== '--top');

if (!target || flag('--help')) {
  console.log('usage: scan.mjs <path|git-url> [--out file.sarif] [--pack a,b] [--top N] [--fail-on-findings]');
  process.exit(target ? 0 : 2);
}

const have = (bin) => { try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; } catch { return false; } };
const engine = ['opengrep', 'semgrep'].find(have);
if (!engine) { console.error('no SAST engine installed (opengrep or semgrep)'); process.exit(1); }

// ---- resolve the target ----------------------------------------------------
// A git URL is cloned into a cache dir. This is NOT corpus/fetch.mjs: that
// fetcher is lock-driven (it refuses any entry without a pinned SHA + SPDX
// license, by design, because corpus entries feed scored baselines). Scanning
// an arbitrary repo has neither, so it gets its own six-line clone rather than
// a licence check it cannot satisfy.
let scanPath;
let sourceLabel = target;
if (/^(https?:\/\/|git@|ssh:\/\/)/.test(target)) {
  const cacheRoot = process.env.SCAN_CACHE_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-scan');
  mkdirSync(cacheRoot, { recursive: true });
  const slug = `${basename(target).replace(/\.git$/, '')}-${createHash('sha1').update(target).digest('hex').slice(0, 8)}`;
  scanPath = join(cacheRoot, slug);
  if (existsSync(scanPath)) {
    console.log(`↻ ${slug} (cached) — git pull`);
    try { execFileSync('git', ['-C', scanPath, 'pull', '--quiet', '--ff-only'], { stdio: 'ignore' }); } catch { /* detached/diverged: scan what's there */ }
  } else {
    console.log(`↓ cloning ${target}`);
    execFileSync('git', ['clone', '--quiet', '--depth', '1', target, scanPath], { stdio: 'inherit' });
  }
  try {
    const head = execFileSync('git', ['-C', scanPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    sourceLabel = `${target}@${head.slice(0, 8)}`;
  } catch { /* not a git checkout */ }
} else {
  scanPath = resolve(target);
  if (!existsSync(scanPath) || !statSync(scanPath).isDirectory()) { console.error(`not a directory: ${scanPath}`); process.exit(2); }
}

// ---- which packs -----------------------------------------------------------
const allPacks = readdirSync(join(ROOT, 'packs')).filter((d) => statSync(join(ROOT, 'packs', d)).isDirectory());
const wantPacks = valOf('--pack') ? valOf('--pack').split(',').map((s) => s.trim()) : allPacks;
const unknown = wantPacks.filter((p) => !allPacks.includes(p));
if (unknown.length) { console.error(`unknown pack(s): ${unknown.join(', ')}  (have: ${allPacks.join(', ')})`); process.exit(2); }

console.log(`scanning ${sourceLabel}`);
console.log(`  engine: ${engine}   packs: ${wantPacks.join(', ')}\n`);

// ---- opengrep pass ---------------------------------------------------------
const configArgs = wantPacks.flatMap((p) => ['--config', join(ROOT, 'packs', p)]);
let sarif = { version: '2.1.0', runs: [] };
try {
  const out = execFileSync(engine, ['scan', ...configArgs, '--sarif',
    ...(engine === 'semgrep' ? ['--metrics=off'] : []), scanPath],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  sarif = JSON.parse(out);
} catch (e) {
  // the engine exits 1 when findings exist — its stdout is still valid SARIF
  try { sarif = JSON.parse(e.stdout); }
  catch { console.error(`engine failed: ${String(e.message).split('\n')[0]}`); process.exit(1); }
}

const findings = [];
for (const run of sarif.runs || []) {
  for (const res of run.results || []) {
    const loc = res.locations?.[0]?.physicalLocation;
    findings.push({
      engine: engine,
      ruleId: res.ruleId,
      file: loc?.artifactLocation?.uri || '',
      line: loc?.region?.startLine ?? null,
      level: res.level || 'warning',
      message: res.message?.text || '',
    });
  }
}

// ---- ast-grep pass ---------------------------------------------------------
// The astgrep/ tree holds the structural (non-taint) half of the corpus. Omit
// it and roughly half the rules are silently absent from the report — the exact
// blind spot score-corpus.mjs had before it was fixed.
if (have('ast-grep') && existsSync(join(ROOT, 'astgrep'))) {
  const sgDir = mkdtempSync(join(tmpdir(), 'bpm-scan-sg-'));
  writeFileSync(join(sgDir, 'sgconfig.yml'), `ruleDirs:\n  - ${join(ROOT, 'astgrep')}\n`);
  const astFindings = [];
  const collect = (json) => {
    for (const m of JSON.parse(json || '[]')) {
      const f = {
        engine: 'ast-grep',
        ruleId: m.ruleId || m.rule_id || '',
        file: m.file || '',
        line: m.range?.start?.line != null ? m.range.start.line + 1 : null,
        level: m.severity || 'warning',
        message: m.message || '',
      };
      findings.push(f);
      astFindings.push(f);
    }
  };
  try {
    collect(execFileSync('ast-grep', ['scan', '-c', join(sgDir, 'sgconfig.yml'), '--json', scanPath],
      { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch (e) {
    try { collect(e.stdout); }
    catch { console.error(`ast-grep pass failed: ${String(e.message).split('\n')[0]}`); }
  }
  // Merge the ast-grep half into the SARIF as its own run. Without this the
  // report file silently covers only the opengrep packs while the console
  // summary counts both — a downstream consumer (CodeReckon, RepoPulse) would
  // read the file and see half the findings with nothing saying so.
  if (astFindings.length) {
    const ruleIds = [...new Set(astFindings.map((f) => f.ruleId))];
    sarif.runs = sarif.runs || [];
    sarif.runs.push({
      tool: { driver: { name: 'ast-grep', informationUri: 'https://ast-grep.github.io', rules: ruleIds.map((id) => ({ id })) } },
      results: astFindings.map((f) => ({
        ruleId: f.ruleId,
        level: /error|critical/i.test(f.level) ? 'error' : /info|hint/i.test(f.level) ? 'note' : 'warning',
        message: { text: f.message },
        locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line ?? 1 } } }],
      })),
    });
  }
} else {
  console.log('⚠ ast-grep not installed — the astgrep/ ruleset was NOT run.');
  console.log('  This report covers the opengrep packs only. `npm i -g @ast-grep/cli` for full coverage.\n');
}

// ---- report ----------------------------------------------------------------
if (findings.length === 0) {
  console.log('0 findings.');
} else {
  const byRule = new Map();
  for (const f of findings) byRule.set(f.ruleId, (byRule.get(f.ruleId) || 0) + 1);
  const ranked = [...byRule.entries()].sort((a, b) => b[1] - a[1]);
  const top = Number(valOf('--top') || 25);
  const w = Math.max(...ranked.slice(0, top).map(([id]) => id.length));

  console.log(`${findings.length} findings across ${byRule.size} rules\n`);
  console.log('  count  rule');
  for (const [id, n] of ranked.slice(0, top)) console.log(`  ${String(n).padStart(5)}  ${id.padEnd(w)}`);
  if (ranked.length > top) console.log(`  ...    ${ranked.length - top} more rules (--top ${ranked.length} to see all)`);

  const byLevel = new Map();
  for (const f of findings) byLevel.set(f.level, (byLevel.get(f.level) || 0) + 1);
  console.log(`\n  by level: ${[...byLevel.entries()].map(([l, n]) => `${l}=${n}`).join('  ')}`);

  // A high-count rule on an unlabeled repo is a triage signal, not a verdict —
  // mem-integer-overflow-malloc fired 25,021 times on Juliet with zero
  // confirmed true positives. Say so here rather than let volume read as risk.
  const noisy = ranked.filter(([, n]) => n > findings.length * 0.25 && n > 50);
  if (noisy.length) {
    console.log(`\n  ⚠ ${noisy.map(([id]) => id).join(', ')} account for most findings.`);
    console.log('    Volume is not severity. Triage the top rule before reading the total as risk.');
  }
}

const outPath = valOf('--out') || join(tmpdir(), `rulepacks-scan-${basename(scanPath)}.sarif`);
writeFileSync(outPath, JSON.stringify(sarif, null, 2));
const sarifCount = (sarif.runs || []).reduce((n, r) => n + (r.results?.length || 0), 0);
console.log(`\nSARIF: ${outPath}  (${sarifCount} results across ${(sarif.runs || []).length} run(s))`);
if (sarifCount !== findings.length) console.log(`  ⚠ ${findings.length - sarifCount} finding(s) shown above are NOT in the SARIF file.`);
console.log('No precision/recall reported — an unlabeled repo has no ground truth. Use `npm run score` for that.');

process.exit(flag('--fail-on-findings') && findings.length ? 1 : 0);
