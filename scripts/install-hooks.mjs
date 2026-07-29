#!/usr/bin/env node
// Point git at the TRACKED hook directory. Run once per clone:  npm run hooks:install
//
// core.hooksPath (not a copy into .git/hooks) so the hook stays version-
// controlled and a fix reaches every machine on the next pull. .git/hooks is
// untracked, which is exactly how a gate silently stops existing on the second
// machine.
import { execFileSync } from 'node:child_process';
import { chmodSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hooksDir = join('scripts', 'hooks');

for (const f of readdirSync(join(root, hooksDir))) chmodSync(join(root, hooksDir, f), 0o755);
execFileSync('git', ['config', 'core.hooksPath', hooksDir], { cwd: root, stdio: 'inherit' });

const current = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: root, encoding: 'utf8' }).trim();
if (current !== hooksDir) { console.error(`FAILED: core.hooksPath is "${current}", expected "${hooksDir}"`); process.exit(1); }

console.log(`hooks installed — core.hooksPath = ${current}`);
console.log(`  ${readdirSync(join(root, hooksDir)).join(', ')}`);
console.log('\npre-push runs the fixture suite + corpus gate when packs/, astgrep/ or corpus/ change.');
console.log('Bypass with `git push --no-verify` only when you mean it.');
