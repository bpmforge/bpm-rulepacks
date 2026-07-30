// Elimination frontier: what does RETIRING a reviewer cost, in findings, per token saved?
// This is the measurement the -0.4% experiment could not make, because that experiment
// invoked all five reviewers in BOTH arms.
import { readFileSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;

// Measured round-1 cost per reviewer invocation (quarry, 32 files).
const COST = { slop: 124240, logging: 120782, codehealth: 132679, performance: 119936, security: 121923 };
const DOMAINS = Object.keys(COST);

// The LLM-only bucket from the differential = findings the CPU tier does NOT reproduce.
// Parse it back out of the committed report rather than re-deriving (same matcher, no drift).
const md = readFileSync(`${DIR}/diff-now.md`, 'utf8');
const llmOnly = new Set();
const section = md.split('## LLM-only')[1].split('## CPU-only')[0];
for (const m of section.matchAll(/^\| `([^`]+)` \| ([^|]*) \| (.+?) \|$/gm)) {
  llmOnly.add(`${m[1]}::${m[3].trim()}`);
}

const W = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const rows = [];
for (const d of DOMAINS) {
  const all = JSON.parse(readFileSync(`${DIR}/findings-${d}.json`, 'utf8'));
  const arr = Array.isArray(all) ? all : all.findings;
  let cov = 0, covW = 0, tot = 0, totW = 0;
  const missed = [];
  for (const f of arr) {
    const key = `${f.file}:${f.line}::${f.title}`;
    // title text in the md table is truncated at ~110 chars; match on prefix
    let isMissed = llmOnly.has(key);
    if (!isMissed) {
      for (const k of llmOnly) {
        const [loc, title] = k.split('::');
        if (loc === `${f.file}:${f.line}` && (f.title.startsWith(title.slice(0, 60)) || title.startsWith(f.title.slice(0, 60)))) { isMissed = true; break; }
      }
    }
    const w = W[f.severity] ?? 1;
    tot++; totW += w;
    if (isMissed) missed.push(f); else { cov++; covW += w; }
  }
  rows.push({ d, cost: COST[d], tot, cov, totW, covW, missed });
}

const totalCost = DOMAINS.reduce((s, d) => s + COST[d], 0);
const totalFind = rows.reduce((s, r) => s + r.tot, 0);
const totalW = rows.reduce((s, r) => s + r.totW, 0);

console.log('## Per-reviewer: what retiring it saves and what it costs\n');
console.log('| domain | tokens | % of bill | findings | CPU-covered | count retained | SEVERITY-WEIGHTED retained |');
console.log('|---|---|---|---|---|---|---|');
for (const r of [...rows].sort((a, b) => (b.cov / b.tot) - (a.cov / a.tot))) {
  console.log(`| ${r.d} | ${r.cost.toLocaleString()} | ${(100 * r.cost / totalCost).toFixed(1)}% | ${r.tot} | ${r.cov} | **${(100 * r.cov / r.tot).toFixed(0)}%** | **${(100 * r.covW / r.totW).toFixed(0)}%** |`);
}
console.log(`| **all 5** | **${totalCost.toLocaleString()}** | 100% | ${totalFind} | ${rows.reduce((s, r) => s + r.cov, 0)} | ${(100 * rows.reduce((s, r) => s + r.cov, 0) / totalFind).toFixed(0)}% | ${(100 * rows.reduce((s, r) => s + r.covW, 0) / totalW).toFixed(0)}% |`);

console.log('\n## Frontier — retire reviewers best-covered first\n');
console.log('| retired | tokens spent | cut vs baseline | findings LOST | weighted value LOST |');
console.log('|---|---|---|---|---|');
const order = [...rows].sort((a, b) => (b.cov / b.tot) - (a.cov / a.tot));
let spent = totalCost, lost = 0, lostW = 0;
console.log(`| — (today) | ${totalCost.toLocaleString()} | 0% | 0 | 0% |`);
const retired = [];
for (const r of order) {
  retired.push(r.d); spent -= r.cost; lost += r.missed.length;
  lostW += r.missed.reduce((s, f) => s + (W[f.severity] ?? 1), 0);
  console.log(`| ${retired.join(' + ')} | ${spent.toLocaleString()} | **${(100 * (1 - spent / totalCost)).toFixed(0)}%** | ${lost} | ${(100 * lostW / totalW).toFixed(0)}% |`);
}

console.log('\n## What is LOST at each step (the silence you cannot sell)\n');
for (const r of order) {
  console.log(`\n### retire \`${r.d}\` → lose ${r.missed.length} findings`);
  for (const f of r.missed) console.log(`- **${f.severity}** \`${f.file}:${f.line}\` — ${f.title}`);
}
