#!/usr/bin/env node
// Adapter: OWASP Juice Shop (JS/TS whole-app integration target) → normalized labels.
//
// Juice Shop marks the vulnerable code for its "coding challenges" with inline
// comment markers:
//   // vuln-code-snippet start <key1> <key2> ...
//   // vuln-code-snippet vuln-line <key1> ...      (the actual flawed line)
//   // vuln-code-snippet neutral-line <key1> ...    (shown, but not the flaw)
//   // vuln-code-snippet hide-line / hide-start / hide-end   (not shown at all)
//   // vuln-code-snippet end <key1> <key2> ...
// (YAML files use `#` instead of `//`; both are handled.)
//
// `vuln-line` is the precise ground truth this adapter cares about — it is
// Juice Shop's own author-asserted "this is the flaw" annotation, one level
// more precise than "flaw is somewhere in this block". `neutral-line` marks
// code in the same block the authors assert is NOT the flaw — used here as a
// `kind:"safe"` (near-identical-code) label, the thing that actually measures
// a rule's false-positive rate per docs/TESTING.md. `hide-*` lines are
// challenge-engine plumbing (score-keeping calls, etc.), not meaningfully
// vuln or safe application code, so they are skipped.
//
// Fallback: if a block (start..end) never contains a `vuln-line` for one of
// its keys (all challenges checked in this corpus revision do, but this
// guards future Juice Shop versions), the block's `start` line is emitted as
// a `vuln` label so the challenge isn't silently dropped from recall.
//
// Only ~26 of Juice Shop's 113 challenges (see data/static/challenges.yml)
// carry inline markers — the rest are "find it by using the app" challenges
// (URL enumeration, client-side-only flows) with no single vulnerable line to
// point a SAST rule at, so they cannot be turned into labels by this method.
// That is expected, not a bug in this adapter (see corpus/labels/juice-shop.md).
//
// Marker matching requires the marker keyword to be immediately preceded by
// `//` or `#` (a real line comment), NOT just "the substring vuln-code-snippet
// followed by start/end" — this excludes the literal regex/string constants in
// lib/codingChallenges.ts (which describe the marker grammar but aren't
// markers themselves) and prose mentions in .ai/skills/*.md / AGENTS.md.
// Scanning is also restricted to source extensions (no .md), which further
// avoids documentation false-matches.
//
// challenge key → CWE: `data/static/challenges.yml` gives each challenge a
// `category` (e.g. "Injection", "Broken Access Control"). This adapter maps
// category → a default CWE (CATEGORY_CWE below), then overrides specific
// well-known keys with a more precise CWE where the actual vulnerable code
// shape justifies it (e.g. the two Injection-category SQL challenges get
// CWE-89, not the generic CWE-74) — see corpus/labels/juice-shop.md for the
// full table and reasoning. This is a best-effort mapping, not a normative
// CWE taxonomy; some picks are judgment calls, called out in the note.
//
// Usage: CORPUS_DIR=... node corpus/adapters/juice-shop.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');
const corpus = join(CORPUS_DIR, 'juice-shop');

if (!existsSync(corpus)) {
  console.error(`juice-shop not fetched — run: npm run corpus:fetch juice-shop`);
  process.exit(1);
}

// ── category → CWE (best-effort; see corpus/labels/juice-shop.md) ──
const CATEGORY_CWE = {
  'Broken Access Control': '284',
  'Broken Anti Automation': '799',
  'Broken Authentication': '287',
  'Cryptographic Issues': '327',
  'Improper Input Validation': '20',
  'Injection': '74',
  'Insecure Deserialization': '502',
  'Miscellaneous': '710',
  'Observability Failures': '532',
  'Security Misconfiguration': '16',
  'Security through Obscurity': '656',
  'Sensitive Data Exposure': '200',
  'Unvalidated Redirects': '601',
  'Vulnerable Components': '1104',
  'XSS': '79',
  'XXE': '611',
};

// Per-challenge overrides where the actual code shape supports a more
// precise CWE than the category default.
const KEY_CWE_OVERRIDE = {
  unionSqlInjectionChallenge: '89',
  dbSchemaChallenge: '89',
  loginAdminChallenge: '89',
  loginBenderChallenge: '89',
  loginJimChallenge: '89',
  noSqlReviewsChallenge: '943',
  forgedReviewChallenge: '639',
  changeProductChallenge: '862',
  registerAdminChallenge: '915',
  weakPasswordChallenge: '521',
  resetPasswordMortyChallenge: '307',
  resetPasswordBenderChallenge: '640',
  resetPasswordBjoernChallenge: '640',
  resetPasswordBjoernOwaspChallenge: '640',
  resetPasswordJimChallenge: '640',
  resetPasswordUvoginChallenge: '640',
  directoryListingChallenge: '548',
  exposedMetricsChallenge: '200',
  restfulXssChallenge: '79',
  localXssChallenge: '79',
  xssBonusChallenge: '79',
  chatbotGreedyInjectionChallenge: '1427',
  chatbotPromptInjectionChallenge: '1427',
  web3WalletChallenge: '841',
};

// ── 1. Parse challenges.yml → key -> category ──
const challengesYml = readFileSync(join(corpus, 'data', 'static', 'challenges.yml'), 'utf8');
const keyCategory = {};
for (const block of challengesYml.split(/\n-\n/)) {
  const key = block.match(/^\s*key:\s*(\S+)/m)?.[1];
  const category = block.match(/category:\s*'([^']+)'/)?.[1];
  if (key) keyCategory[key] = category;
}

function cweFor(key) {
  if (KEY_CWE_OVERRIDE[key]) return [KEY_CWE_OVERRIDE[key]];
  const cat = keyCategory[key];
  if (cat && CATEGORY_CWE[cat]) return [CATEGORY_CWE[cat]];
  return null; // unknown key (e.g. prose false-match) — caller skips it
}

// ── 2. Walk the corpus, find source files, parse markers ──
const SOURCE_EXT = new Set(['.ts', '.js', '.mjs', '.cjs', '.yml', '.yaml', '.sol']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.angular', 'coverage']);
const MARKER_RE = /(?:\/\/|#)\s*vuln-code-snippet\s+(start|end|vuln-line|neutral-line|hide-line|hide-start|hide-end)\b(.*)$/;

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function splitKeys(text) {
  return (text.match(/[A-Za-z][A-Za-z0-9]*/g) || []).filter((w) => w in keyCategory || KEY_CWE_OVERRIDE[w]);
}

const labels = [];
let unknownKeyRefs = 0;
let filesWithMarkers = 0;
const seenChallengeKeys = new Set();

for (const file of walk(corpus)) {
  const ext = file.slice(file.lastIndexOf('.'));
  if (!SOURCE_EXT.has(ext)) continue;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (!text.includes('vuln-code-snippet')) continue;

  const relFile = relative(corpus, file);
  const lines = text.split('\n');
  const open = new Map(); // key -> { startLine, hasVulnLine }
  let fileHadMarker = false;

  lines.forEach((lineText, idx) => {
    const m = lineText.match(MARKER_RE);
    if (!m) return;
    const [, kind, rest] = m;
    const lineNo = idx + 1;
    const keys = splitKeys(rest);

    if (kind === 'start') {
      fileHadMarker = true;
      for (const k of keys) {
        if (!cweFor(k)) { unknownKeyRefs++; continue; }
        open.set(k, { startLine: lineNo, hasVulnLine: false });
        seenChallengeKeys.add(k);
      }
    } else if (kind === 'vuln-line') {
      fileHadMarker = true;
      for (const k of keys) {
        const cwe = cweFor(k);
        if (!cwe) { unknownKeyRefs++; continue; }
        labels.push({ file: relFile, line: lineNo, cwe, kind: 'vuln' });
        const blk = open.get(k);
        if (blk) blk.hasVulnLine = true;
        seenChallengeKeys.add(k);
      }
    } else if (kind === 'neutral-line') {
      fileHadMarker = true;
      for (const k of keys) {
        if (!cweFor(k)) { unknownKeyRefs++; continue; }
        labels.push({ file: relFile, line: lineNo, cwe: [], kind: 'safe' });
      }
    } else if (kind === 'end') {
      fileHadMarker = true;
      for (const k of keys) {
        const blk = open.get(k);
        if (blk && !blk.hasVulnLine) {
          // Block never got a precise vuln-line — fall back to the start
          // line so the challenge isn't silently dropped from recall.
          const cwe = cweFor(k);
          if (cwe) labels.push({ file: relFile, line: blk.startLine, cwe, kind: 'vuln' });
        }
        open.delete(k);
      }
    }
    // hide-line / hide-start / hide-end: challenge-engine plumbing, skipped.
  });

  // Any block still open at EOF (shouldn't happen, but don't lose it silently).
  for (const [k, blk] of open) {
    if (!blk.hasVulnLine) {
      const cwe = cweFor(k);
      if (cwe) labels.push({ file: relFile, line: blk.startLine, cwe, kind: 'vuln' });
    }
  }

  if (fileHadMarker) filesWithMarkers++;
}

const out = join(ROOT, 'corpus', 'labels', 'juice-shop.json');
mkdirSync(join(ROOT, 'corpus', 'labels'), { recursive: true });
writeFileSync(out, JSON.stringify(labels, null, 2) + '\n');

const vulnCount = labels.filter((l) => l.kind === 'vuln').length;
const safeCount = labels.length - vulnCount;
console.log(`scanned ${filesWithMarkers} files with vuln-code-snippet markers`);
console.log(`${seenChallengeKeys.size} distinct challenge keys labeled (of ${Object.keys(keyCategory).length} total challenges in challenges.yml)`);
console.log(`wrote ${labels.length} labels (${vulnCount} vuln, ${safeCount} safe) → corpus/labels/juice-shop.json`);
if (unknownKeyRefs > 0) console.log(`skipped ${unknownKeyRefs} marker key reference(s) not resolvable to a known challenge (prose false-matches or unmapped keys)`);
