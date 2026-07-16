#!/usr/bin/env node
// RED/GREEN fixture runner. For each fixture <name>.vuln.<ext> the mapped rule
// MUST fire; for <name>.ok.<ext> it MUST stay silent. Shells out to the engines
// if present; SKIPS (never false-passes) when a tool is missing — TOOL_PREFLIGHT
// discipline: a check that didn't run is reported SKIPPED, not clean.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function have(bin) {
  try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const ROOT = new URL('..', import.meta.url).pathname;
let pass = 0, fail = 0, skip = 0;

function runOpengrep(config, file) {
  const out = execFileSync('opengrep', ['scan', '--config', config, '--json', file],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return (JSON.parse(out).results || []).length;
}
function runAstGrep(rule, file) {
  // Single rule file → --rule (not --config, which expects an sgconfig.yml project).
  const out = execFileSync('ast-grep', ['scan', '--rule', rule, '--json', file],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return (JSON.parse(out) || []).length;
}

// (engine, config, fixture, expectFire)
const CASES = [
  ['opengrep', 'packs/secrets/', 'fixtures/secrets/aws-key.vuln.txt', true],
  ['opengrep', 'packs/secrets/', 'fixtures/secrets/aws-key.ok.txt', false],
  ['astgrep', 'astgrep/slop/empty-catch.yaml', 'fixtures/slop/empty-catch.vuln.ts', true],
  ['astgrep', 'astgrep/slop/empty-catch.yaml', 'fixtures/slop/empty-catch.ok.ts', false],
];

for (const [engine, config, fixture, expectFire] of CASES) {
  const bin = engine === 'opengrep' ? 'opengrep' : 'ast-grep';
  if (!have(bin)) { console.log(`SKIP  (${bin} not installed)  ${fixture}`); skip++; continue; }
  if (!existsSync(`${ROOT}/${fixture}`)) { console.log(`SKIP  (fixture missing)  ${fixture}`); skip++; continue; }
  let n;
  try { n = engine === 'opengrep' ? runOpengrep(config, fixture) : runAstGrep(config, fixture); }
  catch (e) { console.log(`FAIL  (engine error)  ${fixture}: ${e.message.split('\n')[0]}`); fail++; continue; }
  const fired = n > 0;
  if (fired === expectFire) { console.log(`PASS  ${fixture} (${fired ? 'fired' : 'clean'})`); pass++; }
  else { console.log(`FAIL  ${fixture} expected ${expectFire ? 'FIRE' : 'CLEAN'}, got ${n} match(es)`); fail++; }
}

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
process.exit(fail ? 1 : 0);
