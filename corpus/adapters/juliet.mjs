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
// Many test cases are split across two files (a "...a.c" defining bad()/good()
// and a "...b.c" driver calling them) — the driver file carries no <flaw> tag.
//
// KNOWN LIMITATION (by design, not an oversight): the manifest only marks the
// single flaw line inside the "bad" path. It does NOT mark the good()/good1()/
// good2() safe-variant function bodies that sit in the very same file (or the
// driver-only companion file) — those would need source-level function-boundary
// parsing (Juliet's `/* FLAW: */` / `/* FIX: */` comment markers) to label
// reliably, which is out of this ticket's bounded scope. So this adapter emits
// ONLY "vuln" labels (file+line+CWE from <flaw>); it emits no "safe" labels.
// That means this corpus drives recall only, never a precision/FP-rate signal
// (unlike owasp-benchmark-java, which has real file-level true-negatives).
// A future ticket could add comment-marker parsing to recover "safe" labels.
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
// targets python/ruby/typescript/tsx — none targets c/cpp. This corpus proves
// the zip-fetch + manifest.xml adapter + scorer path end-to-end; it does not,
// and is not meant to, exercise any rule's actual detection quality yet.
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
// finding's "<cwe-dir>/<file>" tail).
const locate = buildBasenameIndex(testcasesDir);

const manifestXml = readFileSync(manifestPath, 'utf8');
const testcaseBlocks = manifestXml.match(/<testcase>[\s\S]*?<\/testcase>/g) || [];

const perCwe = {}; // cweDir -> count already taken
const labels = [];
let totalFlaws = 0, skippedNoFile = 0, skippedOverLimit = 0;

for (const block of testcaseBlocks) {
  const fileBlocks = block.match(/<file path="([^"]+)"[^>]*(?:\/>|>[\s\S]*?<\/file>)/g) || [];
  for (const fb of fileBlocks) {
    const path = fb.match(/<file path="([^"]+)"/)?.[1];
    if (!path) continue;
    const flaws = [...fb.matchAll(/<flaw line="(\d+)" name="CWE-(\d+)[^"]*"/g)];
    if (flaws.length === 0) continue; // driver/companion file — no ground truth here (see header note)
    totalFlaws += flaws.length;
    const loc = locate[path];
    if (!loc) { skippedNoFile += flaws.length; continue; } // manifest entry with no matching file on disk
    const n = (perCwe[loc.cweDir] ??= 0);
    if (n >= PER_CWE_LIMIT) { skippedOverLimit += flaws.length; continue; }
    for (const [, line, cwe] of flaws) {
      labels.push({ file: `${loc.parentDir}/${path}`, line: parseInt(line, 10), cwe: [cwe], kind: 'vuln' });
    }
    perCwe[loc.cweDir] = n + 1;
  }
}

const out = join(ROOT, 'corpus', 'labels', `${name}.json`);
mkdirSync(join(ROOT, 'corpus', 'labels'), { recursive: true });
writeFileSync(out, JSON.stringify(labels, null, 2) + '\n');

const cweCount = Object.keys(perCwe).length;
console.log(`manifest: ${testcaseBlocks.length} testcases, ${totalFlaws} flaw lines across ${Object.keys(locate).length ? cweFolderCount(testcasesDir) : '?'} CWE folders`);
console.log(`wrote ${labels.length} vuln labels (JULIET_PER_CWE_LIMIT=${PER_CWE_LIMIT}, ${cweCount} CWE folders represented) → corpus/labels/${name}.json`);
console.log(`skipped: ${skippedNoFile} (no matching file on disk), ${skippedOverLimit} (over per-CWE limit)`);

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
// are split into sNN sub-shards on disk. Build basename -> {cweDir, parentDir}
// where parentDir is whichever directory directly contains the file (the CWE
// dir itself, or its sNN shard) — that's what score-corpus.mjs's base() (last
// two path segments) will see from a real scan, so the label's `file` must use
// the same immediate-parent tail for a finding to ever be matchable. cweDir is
// tracked separately, only for the per-CWE-folder bound below. A basename
// could in principle repeat across CWE dirs (it doesn't in Juliet — filenames
// embed the CWE prefix — but last-write-wins is safe either way since we only
// ever use it to resolve a manifest path we just parsed).
function buildBasenameIndex(testcasesDir) {
  const idx = {};
  for (const cweDir of readdirSync(testcasesDir, { withFileTypes: true })) {
    if (!cweDir.isDirectory()) continue;
    walk(join(testcasesDir, cweDir.name), cweDir.name);
  }
  return idx;
  function walk(dir, cweDirName) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isFile()) idx[e.name] = { cweDir: cweDirName, parentDir: relative(testcasesDir, dir).split('/').pop() };
      else if (e.isDirectory()) walk(join(dir, e.name), cweDirName);
    }
  }
}
function cweFolderCount(testcasesDir) {
  return readdirSync(testcasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
}
