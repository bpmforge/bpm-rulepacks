#!/usr/bin/env node
// Adapter: NIST Juliet/SARD test suites (C/C++, and any sibling Juliet suite
// that ships the same manifest.xml shape — Java, C#, PHP) → normalized labels.
//
// Juliet's manifest.xml is one flat container of <testcase> blocks. Each
// <testcase> holds one or more <file path="..."> children; a file that
// contains the deliberate defect carries a <flaw line="N" name="CWE-NNN: ..."/>
// child, e.g.:
//   <testcase>
//     <file path="CWE114_Process_Control__w32_char_connect_socket_01.c">
//       <flaw line="121" name="CWE-114: Process Control"/>
//     </file>
//   </testcase>
// Many test cases are split across two or more files (e.g. an "...a.c" driver
// calling into a "...b.c" sink file, or a dedicated "..._bad.cpp" /
// "..._goodG2B.cpp" pair for the virtual-method flow variants) — companion
// files that carry no defect on their own have no <flaw> tag.
//
// SAFE-LABEL RECOVERY (kind:"safe"): every Juliet test case pairs a bad()
// flaw with one or more good()/good1()/good2()/goodG2B()/goodB2G() fixed
// variants, guarded by `#ifndef OMITGOOD ... #endif`. The template generator
// marks the exact defect line in bad() with a `/* FLAW: ... */` or
// `/* POTENTIAL FLAW: ... */` comment (verified: manifest <flaw line="N">
// always points at the code line immediately following that comment, for
// both single-file and split-file variants — see docs/CORPUS.md). The good
// variant mirrors the same structure: either the identical sink line is kept
// (still commented `/* POTENTIAL FLAW: ... */`, because the sink call alone
// can't tell good from bad — only the upstream buffer/source choice does),
// or the line is replaced with a fixed call under a `/* FIX: ... */` comment.
// Either marker, found inside an OMITGOOD-guarded region, identifies a line
// that is genuinely NOT the defect under test — that's our safe label.
//
// Markers used (verified against the fetched corpus, see docs/CORPUS.md):
//   - `/* FIX: ... */` and `/* POTENTIAL FLAW: ... */` (and their `// `
//     line-comment equivalents) — the ONLY two marker forms found opening a
//     comment inside an OMITGOOD block.
//   - `INCIDENTAL` comments are excluded — they flag an unrelated secondary
//     CWE riding along in the same file, not the CWE under test.
// A marker is resolved to a safe label by taking the first real code line
// after the comment closes (skipping blank lines, comment-only lines, and
// bare preprocessor directives, within a small lookahead window). If the
// comment doesn't close, or no code line is found, in that window, the
// marker is left UNRESOLVED (no label emitted) rather than guessed at.
//
// SCOPE: safe-line scanning is done per accepted <testcase> block (every
// sibling <file> in that block — .h headers, drivers, dedicated good-only
// files — not just the file that carries the <flaw>), because some flow
// variants (81/82: virtual-method dispatch) put the good() body in a
// completely separate file from bad(). Only testcase blocks that contributed
// at least one accepted vuln label (i.e. within JULIET_PER_CWE_LIMIT) are
// scanned, so the safe-label set never exceeds the bounded subset below.
// A would-be safe line that collides with an already-emitted vuln line
// (file+line) is dropped rather than double-labeled.
//
// BOUNDED SUBSET: the full C/C++ suite has 64,123 test cases / 65,263 flaw
// lines across 118 CWE folders — labeling all of it would commit a multi-MB
// JSON for no scoring benefit (see below). JULIET_PER_CWE_LIMIT (default 25)
// caps the number of flaw-labeled files taken PER CWE FOLDER, in manifest
// order, so the subset has breadth across all 118 CWE categories rather than
// only the alphabetically-first few. Raise the env var to widen coverage; the
// adapter is deterministic and re-runnable.
//
// WHY LOW/ZERO RECALL IS EXPECTED AND HONEST: every current opengrep rule in
// packs/ targets typescript/javascript and every ast-grep rule in astgrep/
// targets python/ruby/typescript/tsx — none targets c/cpp except the
// C/C++-specific packs/owasp/mem-*.yaml rules. This corpus proves the
// zip-fetch + manifest.xml adapter + scorer path end-to-end and now also
// exercises those C/C++ rules for both recall (vuln labels) and precision
// (safe labels) — it does not exercise any TS/JS/Python rule's detection
// quality.
//
// Usage: CORPUS_DIR=... [JULIET_PER_CWE_LIMIT=25] node corpus/adapters/juliet.mjs [corpus-name]
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');
const PER_CWE_LIMIT = parseInt(process.env.JULIET_PER_CWE_LIMIT || '25', 10);
const name = process.argv[2] || 'juliet-cpp';
const corpus = join(CORPUS_DIR, name);

if (!existsSync(corpus)) {
  console.error(`corpus '${name}' not fetched — run: node corpus/fetch.mjs ${name}`);
  process.exit(1);
}

const manifestPath = findManifest(corpus);
if (!manifestPath) { console.error(`no manifest.xml found under ${corpus}`); process.exit(1); }
const testcasesDir = findTestcasesDir(corpus);
if (!testcasesDir) { console.error(`no testcases/ dir found under ${corpus}`); process.exit(1); }

// basename → "CWE_FOLDER/basename" (2-segment tail, matching score-corpus.mjs's
// base() which keeps only the last two path segments when matching a finding
// to a label — a bare basename with no directory would never match a real
// finding's "<cwe-dir>/<file>" tail). Also keeps the absolute on-disk path so
// we can read file contents for safe-marker scanning below.
const locate = buildBasenameIndex(testcasesDir);

const manifestXml = readFileSync(manifestPath, 'utf8');
const testcaseBlocks = manifestXml.match(/<testcase>[\s\S]*?<\/testcase>/g) || [];

const perCwe = {}; // cweDir -> count already taken
const labels = [];
const vulnLineKeys = new Set(); // "label-file:line" already used by a vuln label
let totalFlaws = 0, skippedNoFile = 0, skippedOverLimit = 0;

// Testcase blocks that contributed >=1 accepted vuln label, with the full set
// of sibling files in that block (for safe-label scanning below).
const acceptedBlocks = [];

for (const block of testcaseBlocks) {
  const fileBlocks = block.match(/<file path="([^"]+)"[^>]*(?:\/>|>[\s\S]*?<\/file>)/g) || [];
  let blockAccepted = false;
  const blockCwes = new Set();
  const blockFiles = []; // {labelFile, fullPath}
  for (const fb of fileBlocks) {
    const path = fb.match(/<file path="([^"]+)"/)?.[1];
    if (!path) continue;
    const loc = locate[path];
    if (loc) blockFiles.push({ labelFile: `${loc.parentDir}/${path}`, fullPath: loc.fullPath });
    const flaws = [...fb.matchAll(/<flaw line="(\d+)" name="CWE-(\d+)[^"]*"/g)];
    if (flaws.length === 0) continue; // driver/companion/header file — no vuln ground truth here
    totalFlaws += flaws.length;
    if (!loc) { skippedNoFile += flaws.length; continue; } // manifest entry with no matching file on disk
    const n = (perCwe[loc.cweDir] ??= 0);
    if (n >= PER_CWE_LIMIT) { skippedOverLimit += flaws.length; continue; }
    for (const [, line, cwe] of flaws) {
      const lineNum = parseInt(line, 10);
      const labelFile = `${loc.parentDir}/${path}`;
      labels.push({ file: labelFile, line: lineNum, cwe: [cwe], kind: 'vuln' });
      vulnLineKeys.add(`${labelFile}:${lineNum}`);
      blockCwes.add(cwe);
    }
    perCwe[loc.cweDir] = n + 1;
    blockAccepted = true;
  }
  if (blockAccepted) acceptedBlocks.push({ files: blockFiles, cwes: blockCwes });
}

// Safe-label pass: scan every file in each accepted testcase block for
// OMITGOOD-guarded FIX/POTENTIAL-FLAW marker lines (see header comment).
const safeLineKeys = new Set();
let markersSeen = 0, markersAmbiguous = 0, safeCollisions = 0;
for (const { files, cwes } of acceptedBlocks) {
  for (const { labelFile, fullPath } of files) {
    let content;
    try { content = readFileSync(fullPath, 'utf8'); } catch { continue; }
    const { lines: safeLines, found, ambiguous } = extractGoodMarkerLines(content);
    markersSeen += found;
    markersAmbiguous += ambiguous;
    for (const ln of safeLines) {
      const key = `${labelFile}:${ln}`;
      if (vulnLineKeys.has(key)) { safeCollisions++; continue; } // never double-label a line
      if (safeLineKeys.has(key)) continue; // dedupe (shouldn't happen, one scan per file)
      safeLineKeys.add(key);
      labels.push({ file: labelFile, line: ln, cwe: [...cwes], kind: 'safe' });
    }
  }
}

const out = join(ROOT, 'corpus', 'labels', `${name}.json`);
mkdirSync(join(ROOT, 'corpus', 'labels'), { recursive: true });
writeFileSync(out, JSON.stringify(labels, null, 2) + '\n');

const cweCount = Object.keys(perCwe).length;
const vulnCount = labels.filter((l) => l.kind === 'vuln').length;
const safeCount = labels.filter((l) => l.kind === 'safe').length;
console.log(`manifest: ${testcaseBlocks.length} testcases, ${totalFlaws} flaw lines across ${Object.keys(locate).length ? cweFolderCount(testcasesDir) : '?'} CWE folders`);
console.log(`wrote ${vulnCount} vuln + ${safeCount} safe labels (JULIET_PER_CWE_LIMIT=${PER_CWE_LIMIT}, ${cweCount} CWE folders represented) → corpus/labels/${name}.json`);
console.log(`vuln: skipped ${skippedNoFile} (no matching file on disk), ${skippedOverLimit} (over per-CWE limit)`);
console.log(`safe: ${markersSeen} FIX/POTENTIAL-FLAW markers found in OMITGOOD blocks, ${safeCount} resolved to a code line, ${markersAmbiguous} left unresolved (comment/code line not found in lookahead window), ${safeCollisions} collided with a vuln line (dropped)`);

// ── helpers ──
function findManifest(root) {
  const direct = join(root, 'C', 'manifest.xml');
  if (existsSync(direct)) return direct;
  return findFile(root, 'manifest.xml', 3);
}
function findTestcasesDir(root) {
  const direct = join(root, 'C', 'testcases');
  if (existsSync(direct)) return direct;
  return findDir(root, 'testcases', 3);
}
function findFile(dir, target, depth) {
  if (depth < 0) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isFile() && e.name === target) return p;
    if (e.isDirectory()) { const r = findFile(p, target, depth - 1); if (r) return r; }
  }
  return null;
}
function findDir(dir, target, depth) {
  if (depth < 0) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name === target) return join(dir, e.name);
  }
  if (depth === 0) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { const r = findDir(join(dir, e.name), target, depth - 1); if (r) return r; }
  }
  return null;
}
// testcases/<CWE_DIR>/<basename> OR testcases/<CWE_DIR>/<sNN>/<basename> —
// large CWE folders (e.g. CWE124_Buffer_Underwrite, CWE36_Absolute_Path_Traversal)
// are split into sNN sub-shards on disk. Build basename -> {cweDir, parentDir,
// fullPath} where parentDir is whichever directory directly contains the file
// (the CWE dir itself, or its sNN shard) — that's what score-corpus.mjs's
// base() (last two path segments) will see from a real scan, so the label's
// `file` must use the same immediate-parent tail for a finding to ever be
// matchable. cweDir is tracked separately, only for the per-CWE-folder bound
// below; fullPath is the absolute on-disk path, used to read file contents
// for safe-marker scanning. A basename could in principle repeat across CWE
// dirs (it doesn't in Juliet — filenames embed the CWE prefix — but
// last-write-wins is safe either way since we only ever use it to resolve a
// manifest path we just parsed).
function buildBasenameIndex(testcasesDir) {
  const idx = {};
  for (const cweDir of readdirSync(testcasesDir, { withFileTypes: true })) {
    if (!cweDir.isDirectory()) continue;
    walk(join(testcasesDir, cweDir.name), cweDir.name);
  }
  return idx;
  function walk(dir, cweDirName) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isFile()) idx[e.name] = { cweDir: cweDirName, parentDir: relative(testcasesDir, dir).split('/').pop(), fullPath: join(dir, e.name) };
      else if (e.isDirectory()) walk(join(dir, e.name), cweDirName);
    }
  }
}
function cweFolderCount(testcasesDir) {
  return readdirSync(testcasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
}

// Scan file content for `#ifndef OMITGOOD ... #endif` regions (depth-aware,
// since some flow variants nest e.g. `#ifdef _WIN32` inside), and within each
// region find `/* FIX: ... */` / `/* POTENTIAL FLAW: ... */` marker comments
// (plus their `// `-style equivalents) that don't also mention INCIDENTAL
// (an unrelated secondary CWE riding along in the same file). Each resolved
// marker maps to the next real code line after the comment closes, searched
// within a small lookahead window — blank lines, comment-only lines, and
// bare preprocessor directives are skipped over, not counted as the target.
// If the comment never closes, or no code line turns up in the window, the
// marker is left unresolved (no line emitted) — see header note on
// conservatism: an unresolved marker just means a missed safe label, not a
// wrong one.
function extractGoodMarkerLines(content) {
  const lines = content.split('\n');
  const n = lines.length;
  const foundLines = new Set();
  let markersSeen = 0, ambiguous = 0;
  let i = 0;
  while (i < n) {
    if (/^\s*#\s*ifndef\s+OMITGOOD\b/.test(lines[i])) {
      let depth = 1, j = i + 1;
      while (j < n && depth > 0) {
        if (/^\s*#\s*(ifndef|ifdef|if)\b/.test(lines[j])) depth++;
        else if (/^\s*#\s*endif\b/.test(lines[j])) depth--;
        if (depth > 0) j++;
      }
      const regionEnd = j; // index of the matching #endif (or n if unterminated)
      for (let k = i + 1; k < regionEnd; k++) {
        const trimmed = lines[k].trim();
        const isBlockMarker = /^\/\*\s*(FIX|POTENTIAL FLAW):/.test(trimmed);
        const isLineMarker = !isBlockMarker && /^\/\/\s*(FIX|POTENTIAL FLAW):/.test(trimmed);
        if (!isBlockMarker && !isLineMarker) continue;
        if (/INCIDENTAL/.test(lines[k])) continue; // unrelated secondary CWE, not the one under test
        markersSeen++;
        let closeIdx = -1;
        if (isBlockMarker) {
          for (let c = k; c < Math.min(k + 6, regionEnd); c++) {
            if (lines[c].includes('*/')) { closeIdx = c; break; }
          }
        } else {
          closeIdx = k;
          while (closeIdx + 1 < regionEnd && /^\s*\/\//.test(lines[closeIdx + 1])) closeIdx++;
        }
        if (closeIdx === -1) { ambiguous++; continue; } // comment never closed in window — don't guess
        let codeIdx = -1;
        for (let d = closeIdx + 1; d < Math.min(closeIdx + 6, regionEnd); d++) {
          const t = lines[d].trim();
          if (t === '') continue;
          if (/^\/\//.test(t)) continue; // another comment-only line
          if (/^\/\*[\s\S]*\*\/$/.test(t)) continue; // full-line block comment
          if (/^#/.test(t)) continue; // bare preprocessor directive — keep looking
          codeIdx = d;
          break;
        }
        if (codeIdx === -1) { ambiguous++; continue; } // no code line found in window — don't guess
        foundLines.add(codeIdx + 1); // 1-indexed source line
      }
      i = regionEnd + 1;
    } else {
      i++;
    }
  }
  return { lines: [...foundLines].sort((a, b) => a - b), found: markersSeen, ambiguous };
}
