#!/usr/bin/env node
// RED/GREEN fixture runner. For each fixture <name>.vuln.<ext> the mapped rule
// MUST fire; for <name>.ok.<ext> it MUST stay silent. Shells out to the engines
// if present; SKIPS (never false-passes) when a tool is missing — TOOL_PREFLIGHT
// discipline: a check that didn't run is reported SKIPPED, not clean.
//
// Fixtures are auto-discovered from fixtures/<pack>/<slug>.{vuln,ok}.<ext> —
// no hand-maintained case list. The rule for a fixture is resolved by
// convention: prefer astgrep/<pack>/<slug>.yaml (ast-grep --rule); else fall
// back to the packs/<pack>/ directory (opengrep --config). This is what lets
// parallel rule tickets land without touching this shared file.
//
// Flags:
//   --only <a,b>   run only fixtures whose "<pack>/<slug>" contains one of
//                  these substrings. Used by the pre-push hook to test just
//                  the rules a push actually touches — the full suite spawns
//                  an engine process per fixture and takes minutes, which is
//                  fine for `npm run check` and far too slow for a hook.
//   -j <n>         concurrency (default: cpu count). Each case is an
//                  independent process spawn, so this is near-linear.
import { execFileSync, execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cpus } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function have(bin) {
  try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const ROOT = new URL('..', import.meta.url).pathname;
let pass = 0, fail = 0, skip = 0;

const argv = process.argv.slice(2);
const valOf = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ONLY = (valOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const JOBS = Math.max(1, Number(valOf('-j') || cpus().length));

async function runOpengrepAsync(config, file) {
  const { stdout } = await execFileAsync('opengrep',
    ['scan', '--config', config, '--scan-unknown-extensions', '--json', file],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return (JSON.parse(stdout).results || []).length;
}
async function runAstGrepAsync(rule, file) {
  const { stdout } = await execFileAsync('ast-grep', ['scan', '--rule', rule, '--json', file],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return (JSON.parse(stdout) || []).length;
}

function runOpengrep(config, file) {
  // --scan-unknown-extensions: fixtures like web.config (real ASP.NET config
  // filename, extension .config) aren't in opengrep's built-in extension→
  // language map even though `languages: [xml]` parses them fine content-wise
  // (verified: opengrep show supported-languages lists xml; --scan-unknown-extensions
  // makes it apply rule language instead of skipping the file). Harmless for
  // every other fixture extension already in the built-in map (.cs, .vb, .js, ...).
  const out = execFileSync('opengrep',
    ['scan', '--config', config, '--scan-unknown-extensions', '--json', file],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return (JSON.parse(out).results || []).length;
}
function runAstGrep(rule, file) {
  // Single rule file → --rule (not --config, which expects an sgconfig.yml project).
  const out = execFileSync('ast-grep', ['scan', '--rule', rule, '--json', file],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return (JSON.parse(out) || []).length;
}

// Discover fixture pairs under fixtures/<pack>/<slug>.{vuln,ok}.<ext> and
// resolve each to an (engine, config) pair.
function discoverCases() {
  const fixturesDir = join(ROOT, 'fixtures');
  const cases = [];
  if (!existsSync(fixturesDir)) return cases;

  for (const packEnt of readdirSync(fixturesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!packEnt.isDirectory()) continue;
    const pack = packEnt.name;
    const packDir = join(fixturesDir, pack);

    const bySlug = new Map();
    for (const fileEnt of readdirSync(packDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!fileEnt.isFile()) continue;
      const m = fileEnt.name.match(/^(.+)\.(vuln|ok)\.[^.]+$/);
      if (!m) continue;
      const [, slug, kind] = m;
      if (!bySlug.has(slug)) bySlug.set(slug, {});
      bySlug.get(slug)[kind] = fileEnt.name;
    }

    for (const [slug, kinds] of bySlug) {
      if (!kinds.vuln || !kinds.ok) {
        console.log(`FAIL  fixtures/${pack}/${slug}: missing ${kinds.vuln ? '.ok' : '.vuln'} fixture (RED/GREEN pair required)`);
        fail++;
        continue;
      }

      const astRule = join(ROOT, 'astgrep', pack, `${slug}.yaml`);
      const opengrepPackDir = join(ROOT, 'packs', pack);
      let engine, config;
      if (existsSync(astRule)) {
        engine = 'astgrep';
        config = relative(ROOT, astRule);
      } else if (existsSync(opengrepPackDir)) {
        engine = 'opengrep';
        config = `packs/${pack}/`;
      } else {
        console.log(`FAIL  fixtures/${pack}/${slug}: no rule found (checked astgrep/${pack}/${slug}.yaml and packs/${pack}/)`);
        fail++;
        continue;
      }

      if (ONLY.length && !ONLY.some((p) => `${pack}/${slug}`.includes(p))) continue;
      cases.push({ engine, config, vuln: `fixtures/${pack}/${kinds.vuln}`, ok: `fixtures/${pack}/${kinds.ok}` });
    }
  }
  return cases;
}

const cases = discoverCases();

if (ONLY.length && cases.length === 0) {
  // An --only filter that matches nothing must not read as "all green". The
  // caller asked for specific rules to be tested and none were.
  console.error(`no fixtures matched --only ${ONLY.join(',')} — nothing was tested`);
  process.exit(2);
}

// Flatten to independent units of work, then run them through a bounded pool.
// Results are collected and printed in discovery order so output stays
// deterministic regardless of completion order.
const units = [];
for (const { engine, config, vuln, ok } of cases) {
  for (const [fixture, expectFire] of [[vuln, true], [ok, false]]) units.push({ engine, config, fixture, expectFire });
}

const results = new Array(units.length);
let next = 0;
async function worker() {
  for (;;) {
    const i = next++;
    if (i >= units.length) return;
    const { engine, config, fixture, expectFire } = units[i];
    const bin = engine === 'opengrep' ? 'opengrep' : 'ast-grep';
    if (!have(bin)) { results[i] = { kind: 'skip', line: `SKIP  (${bin} not installed)  ${fixture}` }; continue; }
    let n;
    try { n = engine === 'opengrep' ? await runOpengrepAsync(config, fixture) : await runAstGrepAsync(config, fixture); }
    catch (e) { results[i] = { kind: 'fail', line: `FAIL  (engine error)  ${fixture}: ${String(e.message).split('\n')[0]}` }; continue; }
    const fired = n > 0;
    results[i] = fired === expectFire
      ? { kind: 'pass', line: `PASS  ${fixture} (${fired ? 'fired' : 'clean'})` }
      : { kind: 'fail', line: `FAIL  ${fixture} expected ${expectFire ? 'FIRE' : 'CLEAN'}, got ${n} match(es)` };
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, units.length) }, worker));

for (const r of results) {
  console.log(r.line);
  if (r.kind === 'pass') pass++; else if (r.kind === 'fail') fail++; else skip++;
}

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped${ONLY.length ? `  (--only ${ONLY.join(',')})` : ''}`);
process.exit(fail ? 1 : 0);
