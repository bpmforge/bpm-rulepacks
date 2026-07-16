#!/usr/bin/env node
// Fetches labeled test corpora pinned in corpus.lock into $CORPUS_DIR
// (default ~/.cache/bpm-rulepacks-corpus). Corpora are NEVER vendored into this
// repo — some are GPL/AGPL and this repo is proprietary. Running our scanner over
// a repo is fine regardless of its license; copying it in is not. Every lock
// entry must carry an SPDX `license`; the fetcher refuses entries missing it.
//
// Usage:
//   node corpus/fetch.mjs            # fetch all pinned corpora
//   node corpus/fetch.mjs <name>     # fetch one
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CORPUS_DIR = process.env.CORPUS_DIR || join(process.env.HOME, '.cache', 'bpm-rulepacks-corpus');
const only = process.argv[2];

const lock = JSON.parse(readFileSync(join(ROOT, 'corpus', 'corpus.lock'), 'utf8'));
const entries = lock.corpora.filter((c) => !only || c.name === only);
if (only && entries.length === 0) { console.error(`no corpus named '${only}' in corpus.lock`); process.exit(2); }
if (entries.length === 0) { console.log('corpus.lock has no corpora yet — see docs/CORPUS.md (pending license verification).'); process.exit(0); }

mkdirSync(CORPUS_DIR, { recursive: true });
let failed = 0;
for (const c of entries) {
  if (!c.license) { console.error(`✗ ${c.name}: missing SPDX license in lock — refusing to fetch`); failed++; continue; }
  if (c.vendor === true) { console.error(`✗ ${c.name}: vendor:true is not allowed — corpora are referenced, never vendored`); failed++; continue; }
  const dest = join(CORPUS_DIR, c.name);
  try {
    if (!existsSync(dest)) {
      console.log(`↓ ${c.name} (${c.license}) ${c.url}@${c.sha.slice(0, 8)}`);
      execFileSync('git', ['clone', '--quiet', c.url, dest], { stdio: 'inherit' });
    }
    execFileSync('git', ['-C', dest, 'fetch', '--quiet', '--depth', '1', 'origin', c.sha], { stdio: 'ignore' });
    execFileSync('git', ['-C', dest, 'checkout', '--quiet', c.sha], { stdio: 'ignore' });
    const head = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (head !== c.sha) { console.error(`✗ ${c.name}: SHA mismatch (got ${head.slice(0, 8)}, want ${c.sha.slice(0, 8)})`); failed++; continue; }
    console.log(`✓ ${c.name} @ ${c.sha.slice(0, 8)} → ${dest}`);
  } catch (e) {
    console.error(`✗ ${c.name}: ${e.message.split('\n')[0]}`); failed++;
  }
}
console.log(`\n${entries.length - failed}/${entries.length} corpora ready in ${CORPUS_DIR}`);
process.exit(failed ? 1 : 0);
