# Authoring rules

## Golden rule: every rule ships with fixtures and passes RED before GREEN

For rule `bpm-<pack>-<slug>`:

1. Write `fixtures/<pack>/<slug>.vuln.<ext>` — code the rule MUST flag.
2. Write `fixtures/<pack>/<slug>.ok.<ext>` — near-identical safe code the rule MUST NOT flag (guards against false positives).
3. Add the rule to `packs/<pack>/<file>.yaml` (Opengrep) or `astgrep/<pack>/<slug>.yaml` (ast-grep).
4. Add the case to `CASES` in `scripts/test-rules.mjs`.
5. `npm run check` — provenance validator + fixture runner must pass.

RED first: confirm the `.vuln` fixture fires and the `.ok` fixture stays clean. A rule with no `.ok` fixture is not done — that's how false positives ship.

## Which engine

- **ast-grep** (`astgrep/`) — structural shape is enough: empty catch, `== null`, `dangerouslySetInnerHTML`, `child_process.exec(<var>)`. Fast, MIT, autofix-capable. Prefer this for slop/pattern rules.
- **Opengrep** (`packs/`) — you need taint (`--taint-intrafile`), metavariable comparison, or multi-file SARIF integration. Use for injection/dataflow-shaped rules.

Author both formats only when a rule is used in both the fast structural sweep and the SARIF security pass.

## Provenance (required — enforced by `validate-provenance.mjs`)

```yaml
metadata:
  license: proprietary        # proprietary | public-teaser (public-teaser also ships MIT in slop-scorecard)
  provenance: authored        # authored | ported:<source-path-or-ref> | llm_draft
  cwe: [89]
  owasp: "A03:2021"           # optional but preferred
  confidence: high            # high | medium | low
  concept: sql_database       # matches a Lodestone concept-ontology key
  since: "0.1.0"
```

`provenance: llm_draft` rules are quarantined — the learning loop drafts them from surviving audit findings, but they never activate in a paid scan until a human reviews and flips them to `authored`.

## Seeding order (convert prose IP → executable rules)

1. `packs/slop/` ← ANTI_SLOP R-01..R-30 (bpm-opencode-experts). Highest leverage.
2. `packs/owasp/` ← METHODOLOGY.md security checklists, one rule per CWE anchor.
3. `packs/secrets/` + `packs/slop/generic/` ← slop-scorecard's 6 regex checks, upgraded to AST.
4. `packs/framework/` ← the experts' framework-specific knowledge (react/fastify/django/rails/drizzle).

## Licensing discipline

Never copy a Semgrep-registry rule or any AGPL rule into this repo. Rules here are authored from primary sources (CWE text, OWASP cheat sheets, our own methodology) or ported from our own MIT/proprietary code. When in doubt, author from scratch against the CWE definition.
