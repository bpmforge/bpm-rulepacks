#!/usr/bin/env node
// Convert a specialist FINDINGS markdown report into SARIF the differential can join on.
//
//   node scripts/llm-findings-to-sarif.mjs <FINDINGS.md> [--repo <path>] > llm.sarif
//
// The expert system's agents/code-review/FINDINGS_SCHEMA.md already REQUIRES a
// location — `file` is a mandatory field documented as
// "src/services/user.service.ts:88 — exact line of the worst instance". The
// contract is right. What is missing is enforcement: some reports carry it
// (bpm-opencode-experts/docs/reviews/SECURITY_FINDINGS.md, 6 of 6) and some
// carry none at all (kryptkeeper/docs/reviews/CODE_REVIEW_2026-04-09.md, 0),
// and the Shipwright dogfood board carries none of 55.
//
// This reads the forms that actually occur in the reports on disk rather than a
// form invented here:
//   **File:** `path/to/file.ts:131-145`
//   **File:** `path/to/file.ts:117`
//   **Location:** path.ts:42
//   `path.ts:42` inside a finding heading
//
// A finding WITHOUT a location is emitted with no `locations` array rather than
// dropped or given a placeholder line. differential.mjs counts those as
// UNJOINABLE and excludes them from the catch-rate, which is the only honest
// treatment: "the CPU missed it" and "nobody said where it is" are different
// facts and must not be summed.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
if (!file) { console.error('usage: llm-findings-to-sarif.mjs <FINDINGS.md> [--repo <path>]'); process.exit(2); }
const repo = argv.includes('--repo') ? argv[argv.indexOf('--repo') + 1] : '';

const text = readFileSync(file, 'utf8');
// Split on finding headings: ####/### with an id-ish prefix, or plain ###.
const chunks = text.split(/\n(?=#{3,4}\s)/);

const SEV = { critical: 'error', high: 'error', medium: 'warning', low: 'note' };
const results = [];
for (const c of chunks) {
  const heading = (c.match(/^#{3,4}\s+(.+)$/m) || [])[1];
  if (!heading || /severity$/i.test(heading.trim())) continue;   // section header, not a finding

  const loc = c.match(/\*\*(?:File|Location)\*\*:?\s*`?([^\s`]+?\.[A-Za-z]+):(\d+)/i)
    || c.match(/`([^\s`]+\.[A-Za-z]+):(\d+)/);
  const sevWord = (c.match(/\*\*Severity\*\*:?\s*(\w+)/i) || [])[1]
    || (text.slice(0, text.indexOf(c)).match(/###\s+(CRITICAL|HIGH|MEDIUM|LOW)\s+SEVERITY/gi) || []).pop()?.match(/(CRITICAL|HIGH|MEDIUM|LOW)/i)?.[1];
  const cwe = [...c.matchAll(/CWE-(\d+)/gi)].map((m) => String(Number(m[1])));

  const r = {
    ruleId: `LLM-${(heading.match(/^([A-Z]\d+)/) || [, heading.slice(0, 40)])[1]}`,
    level: SEV[(sevWord || 'medium').toLowerCase()] || 'warning',
    message: { text: heading.replace(/`/g, '').slice(0, 300) },
    properties: { tags: cwe.map((n) => `CWE-${n}`) },
  };
  if (loc) {
    r.locations = [{ physicalLocation: {
      artifactLocation: { uri: repo ? `${repo.replace(/\/$/, '')}/${loc[1]}` : loc[1] },
      region: { startLine: Number(loc[2]) },
    } }];
  }
  results.push(r);
}

const located = results.filter((r) => r.locations).length;
console.error(`${basename(file)}: ${results.length} finding(s), ${located} with a location, ${results.length - located} unlocatable`);
console.log(JSON.stringify({ version: '2.1.0', runs: [{ tool: { driver: { name: 'llm-specialist', rules: [] } }, results }] }, null, 2));
