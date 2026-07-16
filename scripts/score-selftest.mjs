#!/usr/bin/env node
// Hermetic self-test for the Tier-2 scorer: builds a throwaway corpus with one
// real AWS key (our bpm-secret-aws-access-key rule, CWE-798, MUST fire) and one
// safe env-var line (MUST NOT fire), scores it, and asserts precision=recall=1.
// SKIPs (never false-passes) if no SAST engine is installed. Proves the whole
// SARIF → CWE-match → P/R math against our own rules, no network, no pinned corpus.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function have(b) { try { execFileSync('sh', ['-c', `command -v ${b}`], { stdio: 'ignore' }); return true; } catch { return false; } }
if (!['opengrep', 'semgrep'].some(have)) { console.log('SKIP  score-selftest (no SAST engine)'); process.exit(0); }

const ROOT = new URL('..', import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), 'bpm-score-'));
const corpusDir = join(work, 'corpora');
const corpus = join(corpusDir, 'selftest', 'app');
mkdirSync(corpus, { recursive: true });
writeFileSync(join(corpus, 'config.js'), 'const region = "us-east-1";\nconst key = "AKIAIOSFODNN7EXAMPLE";\n');
writeFileSync(join(corpus, 'config_safe.js'), 'const region = "us-east-1";\nconst key = process.env.AWS_ACCESS_KEY_ID;\n');
const labels = join(work, 'labels.json');
writeFileSync(labels, JSON.stringify([
  { file: 'app/config.js', line: 2, cwe: ['798'], kind: 'vuln' },
  { file: 'app/config_safe.js', line: 2, cwe: ['798'], kind: 'safe' },
]));

let out;
try {
  out = execFileSync('node', [join(ROOT, 'scripts', 'score-corpus.mjs'), 'selftest', '--labels', labels],
    { env: { ...process.env, CORPUS_DIR: corpusDir }, encoding: 'utf8' });
} catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
console.log(out.trim());

const m = out.match(/precision=([\d.]+|n\/a)\s+recall=([\d.]+|n\/a)/);
const tp = /TP=1 FP=0 FN=0/.test(out);
if (tp && m && m[1] === '1.000' && m[2] === '1.000') { console.log('\nPASS  score-selftest — precision=1.000 recall=1.000'); process.exit(0); }
console.error('\nFAIL  score-selftest — expected TP=1/FP=0/FN=0, precision=recall=1.000'); process.exit(1);
