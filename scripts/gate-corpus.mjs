#!/usr/bin/env node
// Local corpus regression gate — runs every corpus that has a committed
// baseline and fails if any regressed.
//
// WHY THIS EXISTS LOCALLY, not only in CI: GitHub Actions for this org is
// budget-blocked ("The job was not started because an Actions budget is
// preventing further use"), so every nightly run since at least 2026-07-24
// died in ~3s without scoring anything. The gate logic was correct that whole
// time — score-corpus.mjs exits 1 on a >0.05 drop — but nothing could run it.
// A gate you cannot run is not a gate. Run this before pushing rule changes.
//
//   npm run gate              # every baselined corpus
//   npm run gate -- juliet-cpp
//
// Corpora must be fetched first (npm run corpus:fetch <name>); a missing
// corpus is reported as SKIPPED and does NOT pass silently.
import { readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const baselined = readdirSync(join(root, 'corpus', 'baselines'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((n) => only.length === 0 || only.includes(n));

if (baselined.length === 0) { console.error('no baselined corpora matched'); process.exit(2); }

const results = [];
for (const name of baselined) {
  const r = spawnSync('node', ['scripts/score-corpus.mjs', name], { cwd: root, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const delta = out.match(/vs baseline: (.*)$/m)?.[1]?.trim() ?? '(no baseline diff)';
  // score-corpus exits 0 with "SKIP" when a corpus isn't fetched. Surface that
  // as SKIPPED rather than letting an unfetched corpus read as a pass.
  const skipped = /^SKIP\b/m.test(out);
  results.push({ name, status: skipped ? 'SKIPPED' : r.status === 0 ? 'ok' : 'REGRESSED', delta, code: r.status });
}

const w = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  const mark = r.status === 'ok' ? '  ok    ' : r.status === 'SKIPPED' ? '  SKIP  ' : '  FAIL  ';
  console.log(`${mark}${r.name.padEnd(w)}  ${r.delta}`);
}

const regressed = results.filter((r) => r.status === 'REGRESSED');
const skipped = results.filter((r) => r.status === 'SKIPPED');
const scored = results.length - skipped.length;
if (skipped.length) console.log(`\n${skipped.length} corpus/corpora not fetched — run: npm run corpus:fetch <name>`);
if (regressed.length) {
  console.error(`\nREGRESSION in ${regressed.length}: ${regressed.map((r) => r.name).join(', ')}`);
  console.error('A red gate means fix the rule, not rebaseline it. Rebaselining erases the only signal.');
  process.exit(1);
}
// A gate that measured NOTHING must not exit 0. On a fresh clone (or the work
// machine) no corpus is fetched, every entry is SKIPPED, and "0 regressions"
// would otherwise print a green all-clear having scored nothing — the same
// false-all-clear shape as `git log @{u}..HEAD` on a branch with no upstream.
// Exit 3 (distinct from 1=regression, 2=bad args) so a caller can tell
// "unmeasured" from "regressed".
if (scored === 0) {
  console.error('\nNOTHING SCORED — every corpus was SKIPPED. This is not a pass.');
  console.error('Fetch at least one: npm run corpus:fetch <name>');
  process.exit(3);
}
console.log(`\nall ${scored} scored corpora at or above baseline`);
