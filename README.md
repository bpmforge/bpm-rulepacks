# bpm-rulepacks

Open (MIT) static-analysis rule packs for the bpmforge fleet — **CodeReckon** (paid audits), **RepoPulse** (SaaS), and the **opencode/Claude expert system**. Authored in-house so we never depend on Semgrep's registry rules (whose license bans service use) or any AGPL rule corpus.

## Why this exists

The Opengrep/Semgrep *engine* is LGPL and free to run commercially. The **rules** are the trap: Semgrep-maintained registry packs (`p/owasp-top-ten`, `p/security-audit`, `p/secrets`, `--config auto`) are licensed for internal use only — "making them available to others as a service" is prohibited. This repo is our own rule corpus, ours to ship in a scanning service.

Every rule is dual-authored where it pays off:
- **Opengrep/Semgrep YAML** (`packs/`) — matching + intra-file taint, SARIF output.
- **ast-grep YAML** (`astgrep/`) — fast structural checks and autofix where dataflow isn't needed.

## Layout

```
packs/                 Opengrep/Semgrep-format rules (.yaml), one dir per pack
  secrets/             hardcoded credentials, keys, tokens
  slop/generic|ts|py|go|java   AI-slop / code-health rules (ports of ANTI_SLOP R-rules)
  owasp/               OWASP Web/LLM Top-10 (own rules, CWE-anchored)
  framework/           react|fastify|django|rails|drizzle framework-specific
astgrep/               ast-grep-format structural rules mirroring packs/ where useful
fixtures/              per-pack test corpus: <rule-id>.vuln.<ext> (must fire) + <rule-id>.ok.<ext> (must not)
scripts/               test runner, provenance validator
docs/                  AUTHORING.md, PROVENANCE.md, LICENSING.md
```

## Rule metadata (required on every rule)

Every rule carries bpmforge provenance under `metadata:` — enforced by `scripts/validate-provenance.mjs`:

```yaml
metadata:
  license: MIT                  # every rule; the repository is MIT (decision 2026-10-28)
  provenance: authored          # authored | ported:<source> | llm_draft (llm_draft never auto-activates)
  cwe: [798]
  owasp: "A07:2021"
  confidence: high              # high|medium|low — feeds finding confidence, gates LLM escalation
  concept: secrets_config       # links to the Lodestone concept ontology
  since: "0.1.0"
```

## Usage

```bash
# Point the whole ruleset at ANY repository — local path or git URL.
# Runs both engines, merges to one SARIF, prints counts by rule.
npm run scan -- ~/Code/some-project
npm run scan -- https://github.com/org/repo --out report.sarif --top 30
npm run scan -- ./src --pack owasp,secrets

# One-time setup per clone: wire the pre-push gate (see docs/TESTING.md).
npm run hooks:install

# Tier 1 — fixtures must fire / stay clean (698 cases, ~6 min parallelised)
npm test
npm test -- --only owasp/a03-sql-injection     # just one rule, ~4s
npm run check                                  # provenance + fixtures + self-test

# Tier 2 — precision/recall vs committed baselines (needs the corpus cache)
npm run corpus:fetch owasp-benchmark-java
npm run gate                                   # every baselined corpus
npm run score -- juliet-cpp --emit /tmp/j.json # dump per-rule detail for triage
```

`scan` reports findings only — never precision or recall, because an unlabeled
repository has no ground truth. Those numbers come from `score`/`gate` against
a corpus with committed labels. **There is no hosted CI**; gating is local by
decision (`docs/CORPUS.md` → "Local-first gating").

The engines themselves are separate binaries: `opengrep` (LGPL, install via its
own `install.sh`) and `ast-grep` (`npm i -g @ast-grep/cli`). Raw invocation
still works if you want it: `opengrep scan --config ./packs/ --sarif src/`.

## Licence

MIT (owner decision 2026-10-28; until then the rules were proprietary, with an
MIT "public-teaser" subset mirrored into `slop-scorecard`). Every rule is
authored from primary sources or ported from our own MIT/Apache projects; no
Semgrep-registry or AGPL rule is ever copied in (`docs/AUTHORING.md`).

## Authoring order (seeding the corpus)

Convert existing prose IP into executable rules first — highest leverage, zero net-new research:
1. Port the **ANTI_SLOP R-01..R-30** rules from bpm-opencode-experts into `packs/slop/`.
2. Port **METHODOLOGY.md** security checklists into `packs/owasp/`.
3. Port **slop-scorecard**'s 6 regex checks into `packs/secrets/` + `packs/slop/generic/` (upgrade regex → AST via ast-grep).
4. Framework packs from the experts' framework knowledge.

See `docs/AUTHORING.md`.
