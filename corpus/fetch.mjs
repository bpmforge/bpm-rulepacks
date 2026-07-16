#!/usr/bin/env node
// Fetches labeled test corpora pinned in corpus.lock into $CORPUS_DIR
// (default ~/.cache/bpm-rulepacks-corpus). Corpora are NEVER vendored into this
// repo — some are GPL/AGPL and this repo is proprietary. Running our scanner over
// a repo is fine regardless of its license; copying it in is not. Every lock
// entry must carry an SPDX `license`; the fetcher refuses entries missing it.
//
// Types: "git" (clone + checkout pinned sha) | "zip" (download + sha256-verify + unzip).
//
// Usage:
//   node corpus/fetch.mjs                 # fetch all pinned corpora
//   node corpus/fetch.mjs <name>          # fetch one
//   PIN_SHA256=1 node corpus/fetch.mjs juliet-cpp   # print the sha256 to pin a new zip
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');
const only = process.argv[2];
const PIN = process.env.PIN_SHA256 === '1';

const lock = JSON.parse(readFileSync(join(ROOT, 'corpus', 'corpus.lock'), 'utf8'));
const entries = lock.corpora.filter((c) => !only || c.name === only);
if (only && entries.length === 0) { console.error(`no corpus named '${only}' in corpus.lock`); process.exit(2); }
if (entries.length === 0) { console.log('corpus.lock has no corpora yet — see docs/CORPUS.md.'); process.exit(0); }

mkdirSync(CORPUS_DIR, { recursive: true });
let failed = 0;
for (const c of entries) {
  if (!c.license) { console.error(`✗ ${c.name}: missing SPDX license — refusing to fetch`); failed++; continue; }
  if (c.vendor === true && c.license !== 'CC0-1.0' && c.license !== 'Unlicense' && !/public domain/i.test(c.license)) {
    console.error(`✗ ${c.name}: vendor:true only allowed for public-domain licenses`); failed++; continue;
  }
  try {
    if ((c.type || 'git') === 'git') await fetchGit(c);
    else if (c.type === 'zip') await fetchZip(c);
    else { console.error(`✗ ${c.name}: unknown type '${c.type}'`); failed++; continue; }
  } catch (e) { console.error(`✗ ${c.name}: ${e.message.split('\n')[0]}`); failed++; }
}
console.log(`\n${entries.length - failed}/${entries.length} corpora ready in ${CORPUS_DIR}`);
process.exit(failed ? 1 : 0);

async function fetchGit(c) {
  const dest = join(CORPUS_DIR, c.name);
  if (!existsSync(dest)) {
    console.log(`↓ ${c.name} (${c.license}) ${c.url}@${c.sha.slice(0, 8)}`);
    execFileSync('git', ['clone', '--quiet', c.url, dest], { stdio: 'inherit' });
  }
  try { execFileSync('git', ['-C', dest, 'fetch', '--quiet', 'origin', c.sha], { stdio: 'ignore' }); } catch { /* sha may already be local */ }
  execFileSync('git', ['-C', dest, 'checkout', '--quiet', c.sha], { stdio: 'ignore' });
  const head = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (head !== c.sha) throw new Error(`SHA mismatch (got ${head.slice(0, 8)}, want ${c.sha.slice(0, 8)})`);
  console.log(`✓ ${c.name} @ ${c.sha.slice(0, 8)} → ${dest}`);
}

async function fetchZip(c) {
  const dest = join(CORPUS_DIR, c.name);
  const zipPath = join(CORPUS_DIR, `${c.name}.zip`);
  if (existsSync(join(dest, '.extracted'))) { console.log(`✓ ${c.name} (cached)`); return; }
  if (!existsSync(zipPath)) {
    console.log(`↓ ${c.name} (${c.license}) ${c.url}`);
    const res = await fetch(c.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
  }
  const got = createHash('sha256').update(readFileSync(zipPath)).digest('hex');
  if (PIN) { console.log(`  sha256=${got}  ← paste into corpus.lock for ${c.name}`); return; }
  if (c.sha256 && c.sha256 !== 'PENDING-first-download' && got !== c.sha256) {
    throw new Error(`sha256 mismatch (got ${got.slice(0, 12)}, want ${String(c.sha256).slice(0, 12)}) — run with PIN_SHA256=1 to inspect`);
  }
  if (!c.sha256 || c.sha256 === 'PENDING-first-download') {
    console.log(`  ⚠ ${c.name}: sha256 not pinned. Verify + set it: PIN_SHA256=1 node corpus/fetch.mjs ${c.name}`);
  }
  mkdirSync(dest, { recursive: true });
  execFileSync('unzip', ['-q', '-o', zipPath, '-d', dest], { stdio: 'inherit' });
  execFileSync('sh', ['-c', `touch "${join(dest, '.extracted')}"`]);
  console.log(`✓ ${c.name} → ${dest}`);
}
