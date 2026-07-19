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
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

function have(bin) {
  try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const ROOT = new URL('..', import.meta.url).pathname;
let pass = 0, fail = 0, skip = 0;

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

      cases.push({ engine, config, vuln: `fixtures/${pack}/${kinds.vuln}`, ok: `fixtures/${pack}/${kinds.ok}` });
    }
  }
  return cases;
}

const cases = discoverCases();

for (const { engine, config, vuln, ok } of cases) {
  for (const [fixture, expectFire] of [[vuln, true], [ok, false]]) {
    const bin = engine === 'opengrep' ? 'opengrep' : 'ast-grep';
    if (!have(bin)) { console.log(`SKIP  (${bin} not installed)  ${fixture}`); skip++; continue; }
    let n;
    try { n = engine === 'opengrep' ? runOpengrep(config, fixture) : runAstGrep(config, fixture); }
    catch (e) { console.log(`FAIL  (engine error)  ${fixture}: ${e.message.split('\n')[0]}`); fail++; continue; }
    const fired = n > 0;
    if (fired === expectFire) { console.log(`PASS  ${fixture} (${fired ? 'fired' : 'clean'})`); pass++; }
    else { console.log(`FAIL  ${fixture} expected ${expectFire ? 'FIRE' : 'CLEAN'}, got ${n} match(es)`); fail++; }
  }
}

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
process.exit(fail ? 1 : 0);
