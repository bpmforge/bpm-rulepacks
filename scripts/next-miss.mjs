#!/usr/bin/env node
// Print a corpus's uncovered defects — the work queue for the
// one-rule-at-a-time loop.
//
//   npm run misses -- sampleco          # every uncovered defect
//   npm run misses -- sampleco --one    # just the next one, for a loop driver
//   npm run misses -- sampleco --json   # machine-readable
//
// This is a FORMATTER, not a second scorer. It shells out to score-corpus.mjs
// and reads the `missed` array from its emitted result. The first version of
// this file reimplemented the label matcher and instantly disagreed with the
// scorer — reporting two already-covered defects as misses, because its CWE
// extraction was weaker than the scorer's extractCwe(). A loop driven by a
// matcher that disagrees with the gate sends you to fix things that aren't
// broken. There is exactly one definition of "covered", and it is in the scorer.
import { spawnSync } from 'node:child_process';
import { readFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = new URL('..', import.meta.url).pathname;
const argv = process.argv.slice(2);
const name = argv.find((a) => !a.startsWith('--'));
if (!name) { console.error('usage: next-miss.mjs <corpus> [--one] [--json]'); process.exit(2); }

const out = join(mkdtempSync(join(tmpdir(), 'bpm-miss-')), 'result.json');
const r = spawnSync('node', ['scripts/score-corpus.mjs', name, '--emit', out], { cwd: ROOT, encoding: 'utf8' });
const combined = (r.stdout || '') + (r.stderr || '');
if (/^SKIP\b/m.test(combined)) { console.error(combined.trim()); process.exit(2); }

let result;
try { result = JSON.parse(readFileSync(out, 'utf8')); }
catch { console.error('score-corpus produced no result:\n' + combined.trim()); process.exit(1); }
try { unlinkSync(out); } catch { /* tmp */ }

const missed = result.missed || [];

// Group by defect id where labels carry one (sampleco's D1..D12), so a defect
// planted at three sites reads as ONE unit of work rather than three. The
// trailing-letter strip folds D5/D5b/D5c together.
const byDefect = new Map();
for (const m of missed) {
  const k = m.defect ? m.defect.replace(/[a-z]$/, '') : `${m.file}:${m.line}`;
  if (!byDefect.has(k)) byDefect.set(k, []);
  byDefect.get(k).push(m);
}

if (argv.includes('--json')) {
  console.log(JSON.stringify({
    corpus: name,
    covered: result.covered, total: result.total, recall: result.recall,
    defectsMissed: [...byDefect.entries()].map(([defect, sites]) => ({ defect, cwe: sites[0].cwe, note: sites[0].note, sites })),
  }, null, 2));
  process.exit(0);
}

console.log(`${name}: ${result.covered}/${result.total} labels covered (recall ${result.recall?.toFixed(3) ?? 'n/a'})`);
console.log(`${byDefect.size} defect(s) still missed\n`);
let shown = 0;
for (const [defect, sites] of byDefect) {
  if (argv.includes('--one') && shown >= 1) break;
  shown++;
  console.log(`  ${defect}  (${sites.length} site${sites.length > 1 ? 's' : ''})  CWE-${(sites[0].cwe || []).join('/')}`);
  if (sites[0].note) console.log(`    ${sites[0].note}`);
  for (const s of sites) console.log(`      ${s.file}:${s.line}`);
  console.log();
}
if (!missed.length) console.log('  none — every label covered.');
