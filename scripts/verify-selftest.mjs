#!/usr/bin/env node
// Hermetic self-test for verify-findings.mjs.
//
// Guards a bug that shipped silently: the SARIF writer assumed `cwe` was always
// an array, so a findings file using a scalar (`"cwe": 918`) threw AFTER the
// summary table had already printed. The run looked successful, reported
// "37 grounded findings", and wrote no SARIF at all — the exact silent-failure
// class these rulepacks exist to detect.
//
// Reviewers emit every one of these shapes in practice. All must survive, and
// "079" must normalise to "79" — a zero-padded CWE string once made a real
// 0.103 recall read as 0/78.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), 'bpm-verify-'));
const repo = join(work, 'repo');
const findings = join(work, 'findings');
mkdirSync(join(repo, 'src'), { recursive: true });
mkdirSync(findings, { recursive: true });

writeFileSync(join(repo, 'src', 'a.js'), [
  'const a = 1;',
  'const key = "AKIAIOSFODNN7EXAMPLE";',
  'eval(userInput);',
  'const c = 3;',
  'db.query("SELECT * FROM t WHERE id = " + id);',
].join('\n') + '\n');

const q = (n) => readFileSync(join(repo, 'src', 'a.js'), 'utf8').split('\n')[n - 1];

writeFileSync(join(findings, 'findings-mixed.json'), JSON.stringify([
  { id: 'arr', domain: 'security', file: 'src/a.js', line: 2, cwe: ['798'], severity: 'HIGH', title: 'hardcoded key', code: q(2), why: 'x' },
  { id: 'num', domain: 'security', file: 'src/a.js', line: 3, cwe: 95, severity: 'HIGH', title: 'eval', code: q(3), why: 'x' },
  { id: 'str', domain: 'security', file: 'src/a.js', line: 5, cwe: 'CWE-89', severity: 'HIGH', title: 'sql concat', code: q(5), why: 'x' },
  { id: 'pad', domain: 'slop', file: 'src/a.js', line: 1, cwe: '079', severity: 'LOW', title: 'padded cwe', code: q(1), why: 'x' },
  { id: 'nul', domain: 'slop', file: 'src/a.js', line: 4, cwe: null, severity: 'LOW', title: 'no cwe', code: q(4), why: 'x' },
], null, 2));

const sarif = join(work, 'out.sarif');
let out = '';
let crashed = false;
try {
  out = execFileSync('node', [join(ROOT, 'scripts', 'verify-findings.mjs'), repo, findings, '--sarif', sarif], { encoding: 'utf8' });
} catch (e) { out = (e.stdout || '') + (e.stderr || ''); crashed = true; }

const fail = (m) => { console.error(out.trim() + `\n\nFAIL  verify-selftest — ${m}`); process.exit(1); };

if (crashed) fail('verify-findings.mjs exited non-zero on mixed cwe shapes');
// The original bug: summary printed, SARIF never written. Assert the ARTIFACT,
// never the exit code — a check that trusts exit 0 is a check that cannot fail.
if (!existsSync(sarif)) fail('no SARIF written (the summary printing is not proof of success)');

const results = JSON.parse(readFileSync(sarif, 'utf8')).runs[0].results;
if (results.length !== 5) fail(`expected 5 grounded findings in SARIF, got ${results.length}`);

const tags = Object.fromEntries(results.map((r) => [r.ruleId.replace(/^LLM-/, ''), r.properties.tags]));
const expect = { arr: ['CWE-798'], num: ['CWE-95'], str: ['CWE-89'], pad: ['CWE-79'], nul: [] };
for (const [id, want] of Object.entries(expect)) {
  const got = tags[id];
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`${id}: expected tags ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

console.log('PASS  verify-selftest — 5 cwe shapes normalised, SARIF written (079 -> 79)');
