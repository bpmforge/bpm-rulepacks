#!/usr/bin/env node
// Mechanically verify LLM findings against the source, then emit SARIF.
//
//   node scripts/verify-findings.mjs <repo> <findings-dir> [--sarif out.sarif]
//
// This is the anti-hallucination gate, and it costs nothing to run. Each finding
// carries `file`, `line` and `code` — the reviewer's verbatim quote of the
// offending source. We re-read the file and check the quote is actually there.
//
// WHY IT EXISTS: a prior audit in this fleet reported a HIGH-severity command
// injection in `tools/grep-mcp.ts` with an evidence block reading "grep-mcp.ts
// likely contains:". The file is not in the tree. That finding would have
// entered the mechanization backlog and produced a rule for a defect that was
// never there. One file read per finding rules that class out entirely.
//
// Verdicts:
//   VERIFIED       quote found at the cited line (±3, engines and humans drift)
//   DRIFTED        quote found in the file, but not near the cited line
//   NOT-IN-FILE    file exists, quote does not appear anywhere in it
//   NO-FILE        the cited file does not exist
//   NO-QUOTE       finding carried no `code` field — unverifiable as submitted
//
// Only VERIFIED and DRIFTED findings go into the SARIF. The rest are reported
// loudly and excluded: a finding we cannot ground is not evidence about the
// codebase, and mechanizing it would build a rule for a hallucination.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const argv = process.argv.slice(2);
const repo = argv[0];
const dir = argv[1];
if (!repo || !dir) { console.error('usage: verify-findings.mjs <repo> <findings-dir> [--sarif out]'); process.exit(2); }

const findings = [];
for (const f of readdirSync(dir).filter((x) => /^findings-.*\.json$/.test(x))) {
  try {
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const x of (Array.isArray(j) ? j : j.findings || [])) findings.push({ ...x, _src: f });
  } catch (e) { console.error(`! ${f}: unparseable — ${e.message.split('\n')[0]}`); }
}
if (!findings.length) { console.error(`no findings found in ${dir}`); process.exit(1); }

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// Escaping-tolerant comparison. A one-character transcription slip in a quote
// must not discard a real finding: lodestone's phantomImports.ts:208 genuinely
// lacks the escapeRegExp() call its two sibling sites have, and the finding was
// being thrown out as NOT-IN-FILE because the reviewer wrote \b where the file
// has \\b. Backslash density is exactly what a human or a model gets wrong when
// transcribing a regex, and it is never what the finding is about.
//
// The skeleton drops every non-alphanumeric character, so escaping, quoting and
// whitespace differences all collapse while the identifiers and structure that
// identify the line survive. A skeleton match is accepted as QUOTE-INEXACT —
// kept, but counted separately, because an inexact quote is a real (small)
// integrity signal and silently normalising it away would hide it.
const skel = (s) => String(s ?? '').replace(/[^A-Za-z0-9]/g, '');
// Accept every shape a reviewer has actually emitted: [79], 79, "CWE-79",
// "79, 918", null. Returns bare numeric strings, zero-stripped — "079" and 79
// must land on the same key or the corpus join silently misses (that string bug
// once made a real 0.103 recall read as 0/78).
const cweList = (v) =>
  (Array.isArray(v) ? v : v == null ? [] : String(v).split(/[,\s]+/))
    .map((c) => String(c).replace(/^CWE-?/i, '').replace(/^0+(?=\d)/, '').trim())
    .filter((c) => /^\d+$/.test(c));
const rows = [];
for (const f of findings) {
  const p = join(repo, f.file || '');
  let verdict, detail = '';
  if (!f.code) verdict = 'NO-QUOTE';
  else if (!f.file || !existsSync(p)) verdict = 'NO-FILE';
  else {
    const lines = readFileSync(p, 'utf8').split('\n');
    const want = norm(f.code);
    const near = lines.slice(Math.max(0, (f.line || 1) - 4), (f.line || 1) + 3).map(norm).join(' ');
    if (want && near.includes(want.slice(0, Math.min(want.length, 60)))) verdict = 'VERIFIED';
    else {
      const all = lines.map(norm);
      const at = all.findIndex((l) => l.includes(want.slice(0, Math.min(want.length, 60))));
      if (at >= 0) { verdict = 'DRIFTED'; detail = `actually at line ${at + 1}`; }
      else {
        // Escaping-tolerant retry before giving up.
        const wantSk = skel(f.code);
        const nearSk = skel(lines.slice(Math.max(0, (f.line || 1) - 4), (f.line || 1) + 3).join(' '));
        const cut = wantSk.slice(0, Math.min(wantSk.length, 40));
        if (cut && nearSk.includes(cut)) { verdict = 'QUOTE-INEXACT'; detail = 'quote differs only in escaping/punctuation'; }
        else {
          const atSk = lines.findIndex((l) => cut && skel(l).includes(cut));
          if (atSk >= 0) { verdict = 'QUOTE-INEXACT'; detail = `escaping differs; line ${atSk + 1}`; }
          else verdict = 'NOT-IN-FILE';
        }
      }
    }
  }
  rows.push({ ...f, verdict, detail });
}

const by = (v) => rows.filter((r) => r.verdict === v);
console.log(`\n# Finding verification — ${basename(repo)}\n`);
console.log(`| Verdict | Count |`);
console.log(`|---|---|`);
for (const v of ['VERIFIED', 'DRIFTED', 'QUOTE-INEXACT', 'NOT-IN-FILE', 'NO-FILE', 'NO-QUOTE']) console.log(`| ${v} | ${by(v).length} |`);
console.log(`| **total** | **${rows.length}** |`);

const bad = rows.filter((r) => ['NOT-IN-FILE', 'NO-FILE', 'NO-QUOTE'].includes(r.verdict));
if (bad.length) {
  console.log(`\n## Excluded — could not be grounded in the source\n`);
  console.log('| id | file:line | verdict | title |');
  console.log('|---|---|---|---|');
  for (const r of bad) console.log(`| ${r.id} | \`${r.file}:${r.line}\` | ${r.verdict} | ${String(r.title).slice(0, 70)} |`);
}
const drift = by('DRIFTED');
if (drift.length) {
  console.log(`\n## Drifted — real code, wrong line (kept, line corrected)\n`);
  for (const r of drift) console.log(`- ${r.id} \`${r.file}:${r.line}\` — ${r.detail}`);
}

console.log(`\n## By domain (grounded only)\n`);
console.log('| Domain | VERIFIED+DRIFTED | excluded |');
console.log('|---|---|---|');
for (const d of [...new Set(rows.map((r) => r.domain))]) {
  const g = rows.filter((r) => r.domain === d && ['VERIFIED', 'DRIFTED', 'QUOTE-INEXACT'].includes(r.verdict)).length;
  const x = rows.filter((r) => r.domain === d).length - g;
  console.log(`| ${d} | ${g} | ${x} |`);
}

const sarifIdx = argv.indexOf('--sarif');
if (sarifIdx >= 0 && argv[sarifIdx + 1]) {
  const keep = rows.filter((r) => ['VERIFIED', 'DRIFTED', 'QUOTE-INEXACT'].includes(r.verdict));
  const results = keep.map((r) => ({
    ruleId: `LLM-${r.id}`,
    level: /critical|high/i.test(r.severity) ? 'error' : /low/i.test(r.severity) ? 'note' : 'warning',
    message: { text: r.title },
    // `cwe` arrives as an array, a bare number, a "CWE-918" string, or null,
    // depending on which reviewer produced the file. Normalise rather than
    // assume: the array assumption used to throw here AFTER the summary table
    // had already printed, so the run looked successful and silently emitted
    // no SARIF at all.
    properties: { tags: cweList(r.cwe).map((c) => `CWE-${c}`), domain: r.domain, severity: r.severity },
    locations: [{ physicalLocation: {
      artifactLocation: { uri: join(repo, r.file) },
      region: { startLine: Number(r.detail.match(/line (\d+)/)?.[1] || r.line) },
    } }],
  }));
  writeFileSync(argv[sarifIdx + 1], JSON.stringify({ version: '2.1.0', runs: [{ tool: { driver: { name: 'llm-review', rules: [] } }, results }] }, null, 2));
  console.log(`\nSARIF (${results.length} grounded findings) → ${argv[sarifIdx + 1]}`);
}
