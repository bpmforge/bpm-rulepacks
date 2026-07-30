// Score Arm C (one reviewer, five lenses) against the five-run baseline.
// Count is NOT the metric. The risk is attention dilution: a lens nominally
// present but not actually run shows up as ONE DOMAIN collapsing, not as a
// uniform drop. So score per domain, and name what was lost.
import { readFileSync } from 'node:fs';
const D = new URL('.', import.meta.url).pathname;
const DOMAINS = ['security', 'slop', 'performance', 'codehealth', 'logging'];

const base = [];
for (const d of DOMAINS) {
  const j = JSON.parse(readFileSync(`${D}/findings-${d}.json`, 'utf8'));
  for (const f of (Array.isArray(j) ? j : j.findings)) base.push({ ...f, domain: d });
}
const armc = JSON.parse(readFileSync(`${D}/findings-multilens.json`, 'utf8'));

// Same discipline as differential.mjs: locations near each other in the same
// file are the same defect. A reviewer pointing at a catch 9 lines below the
// try is describing the one thing. Point matching understated a prior run 3x.
const near = (a, b) => a.file === b.file && Math.abs(Number(a.line) - Number(b.line)) <= 12;
const words = (s) => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);
const jac = (a, b) => { const A = words(a), B = words(b); const i = [...A].filter((x) => B.has(x)).length; return i / Math.max(1, Math.min(A.size, B.size)); };

const used = new Set();
for (const b of base) {
  const cands = armc.map((c, i) => ({ c, i })).filter(({ c, i }) => !used.has(i) && near(b, c));
  cands.sort((x, y) => jac(b.title, y.c.title) - jac(b.title, x.c.title));
  const hit = cands.find(({ c }) => jac(b.title, c.title) >= 0.25 || c.domain === b.domain);
  if (hit) { b.matched = hit.c; used.add(hit.i); }
}

const W = { HIGH: 3, MEDIUM: 2, LOW: 1 };
console.log('## Arm C vs the five-run baseline — per domain\n');
console.log('| lens | baseline | Arm C emitted | baseline REPRODUCED | weighted reproduced |');
console.log('|---|---|---|---|---|');
for (const d of DOMAINS) {
  const b = base.filter((f) => f.domain === d);
  const m = b.filter((f) => f.matched);
  const tw = b.reduce((s, f) => s + (W[f.severity] ?? 1), 0);
  const mw = m.reduce((s, f) => s + (W[f.severity] ?? 1), 0);
  console.log(`| ${d} | ${b.length} | ${armc.filter((f) => f.domain === d).length} | **${m.length}/${b.length} (${(100 * m.length / b.length).toFixed(0)}%)** | ${(100 * mw / tw).toFixed(0)}% |`);
}
const allM = base.filter((f) => f.matched);
const tw = base.reduce((s, f) => s + (W[f.severity] ?? 1), 0);
const mw = allM.reduce((s, f) => s + (W[f.severity] ?? 1), 0);
console.log(`| **total** | **${base.length}** | **${armc.length}** | **${allM.length}/${base.length} (${(100 * allM.length / base.length).toFixed(0)}%)** | **${(100 * mw / tw).toFixed(0)}%** |`);

console.log(`\n## Baseline findings Arm C MISSED (${base.length - allM.length})\n`);
for (const d of DOMAINS) {
  const miss = base.filter((f) => f.domain === d && !f.matched);
  if (!miss.length) continue;
  console.log(`\n**${d}**`);
  for (const f of miss) console.log(`- ${f.severity} \`${f.file}:${f.line}\` — ${f.title}`);
}

const newOnes = armc.filter((_, i) => !used.has(i));
console.log(`\n## NEW — Arm C found, five-run baseline did not (${newOnes.length})\n`);
for (const f of newOnes) console.log(`- **${f.domain}** ${f.severity} \`${f.file}:${f.line}\` — ${f.title}`);
