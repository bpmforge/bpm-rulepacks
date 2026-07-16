# bpm-rulepacks

Proprietary static-analysis rule packs for the bpmforge fleet — **CodeReckon** (paid audits), **RepoPulse** (SaaS), and the **opencode/Claude expert system**. Authored in-house so we never depend on Semgrep's registry rules (whose license bans service use) or any AGPL rule corpus.

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
  license: proprietary          # or "public-teaser" for the MIT subset shipped in slop-scorecard
  provenance: authored          # authored | ported:<source> | llm_draft (llm_draft never auto-activates)
  cwe: [798]
  owasp: "A07:2021"
  confidence: high              # high|medium|low — feeds finding confidence, gates LLM escalation
  concept: secrets_config       # links to the Lodestone concept ontology
  since: "0.1.0"
```

## Usage

```bash
# Opengrep (the engine — install separately, LGPL)
opengrep scan --config ./packs/ --sarif -o out.sarif src/

# ast-grep structural pass
ast-grep scan --config ./astgrep/ src/

# Run the pack's own test suite (fixtures must fire / stay clean)
node scripts/test-rules.mjs
```

## Public teaser subset

Rules tagged `license: public-teaser` are mirrored (MIT) into `slop-scorecard` for marketing reach. Everything else is proprietary and ships only inside CodeReckon/RepoPulse.

## Authoring order (seeding the corpus)

Convert existing prose IP into executable rules first — highest leverage, zero net-new research:
1. Port the **ANTI_SLOP R-01..R-30** rules from bpm-opencode-experts into `packs/slop/`.
2. Port **METHODOLOGY.md** security checklists into `packs/owasp/`.
3. Port **slop-scorecard**'s 6 regex checks into `packs/secrets/` + `packs/slop/generic/` (upgrade regex → AST via ast-grep).
4. Framework packs from the experts' framework knowledge.

See `docs/AUTHORING.md`.
