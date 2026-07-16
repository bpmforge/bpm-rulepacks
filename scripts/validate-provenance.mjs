#!/usr/bin/env node
// Validates that every rule in packs/ and astgrep/ carries required bpmforge
// provenance metadata. Zero external deps — minimal YAML field probing by regex,
// which is sufficient for a lint gate (full YAML parse happens in the engines).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const REQUIRED = ['license', 'provenance', 'confidence', 'since'];
const LICENSES = new Set(['proprietary', 'public-teaser']);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.yaml', '.yml'].includes(extname(p))) out.push(p);
  }
  return out;
}

let errors = 0;
for (const base of ['packs', 'astgrep']) {
  let files;
  try { files = walk(join(ROOT, base)); } catch { continue; }
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    if (!/metadata:/.test(text)) { console.error(`MISSING metadata: block: ${f}`); errors++; continue; }
    for (const key of REQUIRED) {
      if (!new RegExp(`^\\s+${key}:`, 'm').test(text)) { console.error(`MISSING ${key}: ${f}`); errors++; }
    }
    const lic = text.match(/^\s+license:\s*(\S+)/m)?.[1];
    if (lic && !LICENSES.has(lic)) { console.error(`BAD license "${lic}": ${f}`); errors++; }
  }
}
if (errors) { console.error(`\n${errors} provenance error(s).`); process.exit(1); }
console.log('provenance OK');
