#!/usr/bin/env node
// Adapter: OWASP Benchmark (Java) → normalized labels.
// Reads the fetched corpus's expectedresults-1.2.csv and emits
// corpus/labels/owasp-benchmark-java.json in the {file,line,cwe,kind} shape.
//
// CSV columns: "# test name, category, real vulnerability, cwe"
//   BenchmarkTest00001,pathtraver,true,22
// Each test name maps to a source file under src/main/java/.../testcode/<name>.java.
// real==true → kind "vuln"; real==false → kind "safe" (the true-negatives that
// make Benchmark useful for measuring false-positive rate). Line is omitted
// (Benchmark labels are file-level); the scorer is file+CWE matching here.
//
// Usage: CORPUS_DIR=... node corpus/adapters/owasp-benchmark-java.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');
const corpus = join(CORPUS_DIR, 'owasp-benchmark-java');

const csvPath = ['expectedresults-1.2.csv', 'expectedresults-1.1.csv', 'expectedresults.csv']
  .map((f) => join(corpus, f)).find(existsSync);
if (!csvPath) { console.error(`no expectedresults CSV in ${corpus} — fetch the corpus first`); process.exit(1); }

const rows = readFileSync(csvPath, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
const labels = [];
for (const line of rows) {
  const [name, , real, cwe] = line.split(',').map((s) => s.trim());
  if (!name || !name.startsWith('BenchmarkTest')) continue;
  labels.push({
    file: `testcode/${name}.java`,
    cwe: cwe ? [cwe.replace(/\D/g, '')] : [],
    kind: /true/i.test(real) ? 'vuln' : 'safe',
  });
}

const out = join(ROOT, 'corpus', 'labels', 'owasp-benchmark-java.json');
mkdirSync(join(ROOT, 'corpus', 'labels'), { recursive: true });
writeFileSync(out, JSON.stringify(labels, null, 2) + '\n');
const v = labels.filter((l) => l.kind === 'vuln').length;
console.log(`wrote ${labels.length} labels (${v} vuln, ${labels.length - v} safe) → corpus/labels/owasp-benchmark-java.json`);
