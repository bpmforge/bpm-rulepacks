# Authoring rules

## Golden rule: every rule ships with fixtures and passes RED before GREEN

For rule `bpm-<pack>-<slug>`:

1. Write the rule: `packs/<pack>/<file>.yaml` (Opengrep) or `astgrep/<pack>/<slug>.yaml` (ast-grep).
2. Write `fixtures/<pack>/<slug>.vuln.<ext>` — code the rule MUST flag.
3. Write `fixtures/<pack>/<slug>.ok.<ext>` — near-identical safe code the rule MUST NOT flag (guards against false positives).
4. `npm run check` — provenance validator + fixture runner must pass.

That's it — there is no shared case list to register. **No CASES array, no edit to `scripts/test-rules.mjs`.**

## How discovery works

`scripts/test-rules.mjs` scans `fixtures/<pack>/` for every `<slug>.vuln.<ext>` / `<slug>.ok.<ext>` pair and resolves the rule by convention:

1. If `astgrep/<pack>/<slug>.yaml` exists, run it via `ast-grep --rule`.
2. Otherwise, if `packs/<pack>/` exists, run it via `opengrep --config` (the whole pack directory).
3. Otherwise the fixture pair fails with "no rule found" — fixtures always need a matching rule.

Because resolution is filename-convention based, adding a rule + its fixtures is a **self-contained change**: no other file in the repo needs to be touched. This is what lets multiple rule tickets land in parallel without colliding on `scripts/test-rules.mjs` — the old hand-maintained `CASES` array was a shared-file bottleneck that serialized every rule ticket through one merge queue.

RED first: confirm the `.vuln` fixture fires and the `.ok` fixture stays clean. A rule with no `.ok` fixture is not done — that's how false positives ship.

## Which engine

- **ast-grep** (`astgrep/`) — structural shape is enough: empty catch, `== null`, `dangerouslySetInnerHTML`, `child_process.exec(<var>)`. Fast, MIT, autofix-capable. Prefer this for slop/pattern rules.
- **Opengrep** (`packs/`) — you need taint (`--taint-intrafile`), metavariable comparison, or multi-file SARIF integration. Use for injection/dataflow-shaped rules.

Author both formats only when a rule is used in both the fast structural sweep and the SARIF security pass.

## Provenance (required — enforced by `validate-provenance.mjs`)

```yaml
metadata:
  license: MIT                # every rule (the repository is MIT)
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

## ANTI_SLOP coverage — R-01..R-10 (W1-01)

Ported from `~/Code/bpm-opencode-experts/agents/shared/ANTI_SLOP_RULES.md`. Rules
needing cross-file counting, dataflow independence proof, or architectural-layer
judgment are **LLM-tier** — not force-fit into a structural/regex pattern that
would either miss the real signal or false-positive on legitimate code. They stay
in the LLM-triage tier of the pipeline (Tier-2/3), not the deterministic Tier-0/1
rule packs.

| Rule | Title | Status | Notes |
|------|-------|--------|-------|
| R-01 | Catch-all swallowing | ported (ast-grep) | `astgrep/slop/empty-catch.yaml` |
| R-02 | try/catch inside tight loops | ported (ast-grep) | `astgrep/slop/try-catch-in-loop.yaml` |
| R-03 | Exception-driven control flow | ported (ast-grep) | `astgrep/slop/try-parse-fallback.yaml` — narrowed to the canonical `JSON.parse` shape; the general "exceptions for expected states" judgment is broader than one pattern can cover |
| R-04 | Serial awaits blocking parallelism | **LLM-tier** | Detecting whether consecutive `await`s are independent requires dataflow (does statement N's argument reference statement N-1's result?) — not expressible as a single structural pattern without false-flagging genuinely dependent chains |
| R-05 | Single-implementation interfaces/factories | **LLM-tier** | Requires counting implementations of an interface *across the whole codebase*; a per-file AST rule has no cross-file aggregation |
| R-06 | Delegation-only wrapper classes | ported (ast-grep) | `astgrep/slop/delegation-only-wrapper.yaml` — narrowed to the canonical zero-arg-constructor/zero-arg-method forwarding shape |
| R-07 | Single-use helper functions | **LLM-tier** | Requires counting call sites for a function across the codebase — a frequency property, not a structural shape |
| R-08 | Repository pattern on simple CRUD | **LLM-tier** | Requires recognizing a 3-layer architecture (repo→DAO→service) wrapping trivial ORM calls — an architectural judgment spanning multiple files/classes, not a single-file pattern |
| R-09 | Null checks on types you control | ported (ast-grep) | `astgrep/slop/redundant-null-undefined-check.yaml` — narrowed to the mechanically-redundant compound form `x === null \|\| x === undefined` (always equivalent to `x == null`); the fuller "type you control vs. boundary" judgment needs type-system context |
| R-10 | Fallback values that hide failures | ported (ast-grep) | `astgrep/slop/fallback-hides-failure.yaml` — narrowed to bare `catch { return []/""/null }` |

Concept-ontology note: the seed ontology (`concept-ontology-seed.yaml`) is
security/CWE-scoped (20 keys) and has no general code-quality/architecture
bucket. R-02/R-03/R-10 map to `logging_audit` (closest existing concept —
error-handling shape); R-09 maps to `input_validation` (null-checking as a
lightweight validation form). R-06 (delegation-only wrapper) has no reasonable
existing-key fit, so its rule metadata uses `concept: code_quality` — a new key
not yet defined in the ontology seed. Flagging here for whoever next expands the
ontology; it's a metadata label choice, not an edit to the ontology file itself.

## ANTI_SLOP coverage — R-11..R-20 (W1-02)

Ported from `~/Code/bpm-opencode-experts/agents/shared/ANTI_SLOP_RULES.md`.
This batch is Categories 3-5 (Config/Flag Slop, Comment and Style Slop,
Structural Slop) — heavier on spec-context and cross-file/cross-doc judgment
than R-01..R-10, so the ported fraction is lower (2/10, honest count, not
padded). The discriminator used: could a near-identical `.ok` fixture stay
clean? If the only way to keep `.ok` clean is to write categorically
different code (not just remove the antipattern), the rule needs judgment
ast-grep can't apply and stays LLM-tier.

| Rule | Title | Status | Notes |
|------|-------|--------|-------|
| R-11 | Unspecified retry logic | **LLM-tier** | Whether a retry is "spec-required" lives in a design doc, not in the code shape; flagging every retry+backoff construct would false-positive on legitimately-specified retries (e.g. idempotent payment calls) |
| R-12 | Feature flags on unreleased code | **LLM-tier** | "Has no users and no rollout plan" is a project-state fact, not a code shape; the same `if (flags.x)` conditional is fine or slop depending on SCOPE.md, which ast-grep cannot read |
| R-13 | What-comments | **LLM-tier** | Considered an opener-catalog regex (`^(increment\|check if\|loop through\|...)`) but it fails the `.ok`-fixture test: a legitimate WHY-comment that happens to start with one of those verbs (e.g. `// check if token expired before the grace window, per RFC 7519`) would also fire, so the `.ok` fixture could only stay clean by writing categorically different code, not near-identical safe code. Comment-vs-code semantic comparison needs NL understanding this pack doesn't have |
| R-14 | Step-by-step narration blocks | ported (ast-grep) | `astgrep/slop/step-by-step-narration.yaml` — `// Step N:` numbered comments are always the antipattern regardless of context (unlike R-13, there's no legitimate use of this exact shape), so it passes the `.ok`-fixture test cleanly |
| R-15 | Stale JSDoc / docstring parameters | **LLM-tier** | Requires comparing the *set* of `@param` names in a docstring against the *set* of actual function parameter names and flagging a mismatch — a set-equality check across two node lists, not a single structural pattern ast-grep's rule DSL expresses |
| R-16 | Emojis in code comments | ported (ast-grep) | `astgrep/slop/emoji-in-comments.yaml` — an emoji in a source comment is always the antipattern regardless of context, passes the `.ok`-fixture test cleanly |
| R-17 | Speculative generalization | **LLM-tier** | "No planned second use case" is validated against MODULE_DESIGN.md § Plugin Points, an external doc, not a property of the code shape itself |
| R-18 | Cargo-cult patterns | **LLM-tier** | Requires tracing the pattern (circuit breaker, rate limiter, message queue, ...) back to a specific SRS.md requirement — a doc-trace judgment, not a code shape |
| R-19 | Duplicated blocks (copy-paste growth) | **LLM-tier / different-tool-tier** | Clone detection needs cross-block token/AST comparison across the whole file or repo (jscpd/PMD-CPD class of tool), not a single-file structural pattern; already covered elsewhere in the pipeline by the Duplication Detector agent's jscpd run, out of scope for a per-slug ast-grep rule |
| R-20 | Inconsistent pattern usage | **LLM-tier** | Requires comparing a new file's shape against sibling files' established patterns — cross-file consistency judgment, not expressible as a single-file ast-grep rule |

Concept-ontology note (continued): R-14 and R-16 use `concept: code_quality`,
the same new key R-06 introduced — still not present in the ontology seed
file itself, just a label choice for whoever expands it next. `cwe: [1078]`
("Inappropriate Source Code Style or Formatting") is used for both since
neither has a more specific CWE anchor; this is a style/quality signal, not
a security one, so the CWE field is illustrative rather than load-bearing
for these two rules.

## ANTI_SLOP coverage — R-21..R-30 (W1-03)

Ported from `~/Code/bpm-opencode-experts/agents/shared/ANTI_SLOP_RULES.md`.
This batch is the 2025-2026 additions (Categories 6-8: Supply Chain Slop,
Structural Slop, Vendoring & Provenance Slop) — like R-11..R-20, most of
these rely on state a single-file AST rule cannot see: a package registry
response, a second file's contents, cross-service trust boundaries, or a
whole-tree consistency judgment. 4/10 ported (the shapes with an
always-true structural core), matching the honest-count discipline used
for R-11..R-20 — this **completes the R-01..R-30 map** across the three
coverage tables in this file.

| Rule | Title | Status | Notes |
|------|-------|--------|-------|
| R-21 | Hallucinated package names (slopsquatting) | **tool-tier, deferred** | Requires a live registry lookup (`npm view`/`pip show` returning 404, or weekly-download count) — no static rule can make a network call. Same reasoning as `hallucinatedDeps`/`dependencyRisk` (W1-06): this is the Dependency Auditor agent's job (registry/OSV feed), not a pattern rule. |
| R-22 | Architectural privilege escalation paths | **LLM-tier** | "Service A reuses Service B's admin client without authorization" is a trust-boundary judgment across multiple services/files — the AI reused a client it saw in context; no single-file AST shape distinguishes an authorized cross-service call from an unauthorized one. |
| R-23 | Elevated credential leakage rate | ported (ast-grep) | `astgrep/slop/hardcoded-env-fallback.yaml` — narrowed to the fallback-specific shape `process.env.$SECRET_LIKE \|\| "literal"` (env-var name constrained to secret-shaped keywords so `process.env.PORT \|\| "3000"` stays clean). The plainer "hardcoded secret literal assignment" half of R-23 is already covered by `packs/secrets/hardcoded-credentials.yaml` (a different pack, W1-06) — not re-ported here to avoid a duplicate rule across pack boundaries. |
| R-24 | Docstring inflation (Logic Density Ratio) | **LLM-tier** | LDR is a ratio of two line/node counts (doc lines vs. logic lines) compared against a threshold (< 1.0) — ast-grep's rule DSL has no count/measure/ratio operator, only structural matching. Comparable to R-19 (a metric over a whole construct, not a fixed shape). |
| R-25 | Phantom imports | **tool-tier, deferred** | The rule's own enforcement line names the real tool: `eslint --rule 'no-unused-vars'` / `pylint W0611`. Detecting "this import binding has zero other occurrences in the file" needs whole-file reference counting per identifier, the same shape as R-07 (single-use helper functions) and `dead-exports` (W1-06) — no fixed pattern discriminates without that count. |
| R-26 | Disconnected pipelines (dead scaffolding) | **LLM-tier** | Every example in the rule text (event emitter never subscribed, queue never consumed, middleware never mounted) is a registration/consumption pair that normally lives in *different files* (e.g. middleware defined in one module, `app.use()` in `server.js`) — the whole point is cross-file wiring, structurally identical to why R-08/R-17 stayed LLM-tier. |
| R-27 | Unimplemented stubs as features | ported (ast-grep) | `astgrep/slop/unimplemented-stub-throw.yaml` — narrowed to the canonical shape the rule's own grep signal names: `throw new Error("not implemented")` and near variants (`unimplemented`, `todo...implement`). This exact throw is never legitimate production code, so the `.ok` fixture stays clean just by implementing the function — no context needed, unlike the broader "any stub" judgment (which would need to know if it's on a declared TODO branch). |
| R-28 | LLM output consumed without validation | ported (opengrep, taint) | `packs/slop/llm-output-unvalidated-sink.yaml` — source `$LLM.generate(...)`, sinks `db.execute($SINK)` / `eval($SINK)` (single-arg shape only — a validated call with extra args, e.g. `db.execute(validated.sql, validated.params)`, doesn't match the sink pattern's arity, so the `.ok` fixture stays clean structurally, matching how a09/a10 constrain their sinks). Source→sink dataflow, so this is the taint-mode case the "which engine" section calls for, not ast-grep. |
| R-29 | Prose padding (local LLM output slop) | ported (opengrep, generic) | `packs/slop/prose-padding.yaml` — two rules for the two always-bad phrase classes the ANTI_SLOP text itself enumerates as filler regardless of context: confidence-hedging openers ("it's worth noting that", "one might consider") and fake-specificity citations ("industry best practices" with no named source). Unlike R-13 (what-comments), there's no legitimate use of these exact phrases in a findings report, so the `.ok`-fixture test passes cleanly. `language: generic` + `pattern-regex` (not ast-grep — this is prose text in `.md` deliverables, not a programming-language AST), matching the existing `packs/secrets/` convention for text-shaped rules. |
| R-30 | Library-shaped reimplementation (silent fork) | **tool-tier, deferred** | The rule's own Detection line names an existing validator: `scripts/validators/validate-vendor-provenance.sh` (in `bpm-opencode-experts`, out of this repo's scope). Checking a "we use library X" claim requires diffing a vendored directory against the real upstream artifact and cross-referencing a `VENDORED.md` manifest against what's actually on disk — cross-file/cross-repo by definition, not a single-file pattern. |

Concept-ontology note (continued): R-23 reuses `concept: secrets_config`
(existing key). R-27 and R-29 reuse `concept: code_quality` (the same new
key R-06/R-14/R-16 introduced, still not in the ontology seed file itself).
R-28 is the one rule in this batch with an exact ontology fit: `concept:
llm_ai` already exists in `concept-ontology-seed.yaml` with `cwe: [1426]`
(Improper Validation of Generative AI Output) as its anchor; this rule's
own `cwe: [74]` (general injection, CWE anchor for the specific
db.execute/eval sink shape) is used on the rule itself since the concept
key, not the rule metadata, is what carries the ontology-level CWE.

## OWASP coverage — A06-A10 (W1-05)

Ported from `~/Code/bpm-opencode-experts/agents/security/OWASP_METHODOLOGY.md`
Passes 6-10. This batch is the CWE-dataflow-heavy back half of the Top 10 —
A06 is largely CVE-feed-driven (already covered elsewhere in the pipeline by
osv-scanner/npm-audit + the Dependency Auditor agent, not re-implemented as
static rules here), and A07-A10 lean on taint tracking, so opengrep's
`mode: taint` is used wherever the vulnerability is a source→sink dataflow
shape rather than a single-node structural pattern.

| Rule | Category | Engine | CWE | Notes |
|------|----------|--------|-----|-------|
| a06-known-vulnerable-package | A06 | ast-grep (json) | 1104 | Flags specific deprecated/CVE-heavy packages (`request`, `node-serialize`, `serialize-javascript`) by name in a manifest. Broader "any outdated version" detection needs a live CVE feed — that's the Dependency Auditor's job (osv-scanner/grype), not a pattern rule; kept to the narrow, always-true case. |
| a07-jwt-alg-none | A07 | ast-grep (ts) | 347 | `algorithms: ["none"]` on JWT verify — signature bypass. |
| a07-hardcoded-jwt-secret | A07 | ast-grep (ts) | 798 | `jwt.sign(payload, "literal")` — constrains the secret metavar to `kind: string` so `process.env.X` doesn't match. |
| a07-plaintext-password-compare | A07 | ast-grep (ts) | 256 | Direct `===`/`==` on `.password` instead of a constant-time hash compare. |
| a07-cookie-insecure-flag | A07 | ast-grep (ts) | 614 | Explicit `secure: false` on a session cookie. |
| a08-pickle-loads | A08 | ast-grep (py) | 502 | `pickle.loads()` — arbitrary object deserialization. |
| a08-yaml-unsafe-load | A08 | ast-grep (py) | 502 | `yaml.load()` with no `Loader=` arg (the 1-arg call shape only — `yaml.safe_load()` and the 2-arg `Loader=` form don't match). |
| a08-unpinned-ci-action | A08 | ast-grep (yaml) | 829 | GitHub Actions `uses: owner/repo@vN` floating tag vs. a pinned 40-char SHA. Metavariable regex constraint on the whole scalar (`@v?[0-9]+(\.[0-9]+)*$`) — YAML values are single leaf tokens so the ref can't be split into separate metavars, only tested as a whole. |
| a09-sensitive-data-logged | A09 | ast-grep (ts) | 532 | `logger.*`/`console.*` call with a nested `password`/`token`/`secret` object key anywhere in its arguments (`has: {stopBy: end}` over the call, not just the first arg). |
| a09-log-injection | A09 | opengrep (taint) | 117 | `req.body/query/params` → `logger.*`/`console.log` with no sanitization. |
| a10-ssrf-user-controlled-url | A10 | opengrep (taint) | 918 | `req.body/query` → `axios`/`fetch`/`http.get`. DNS-rebinding/redirect-chain bypass of an allowlist is a runtime/dataflow judgment beyond a single taint rule and stays LLM-tier. |

Deferred to LLM-tier / other-tool-tier (multi-file, live-data, or judgment-based
— not force-fit into a rule that would either miss the signal or false-positive):
missing rate-limiting/CAPTCHA on login (A07 — needs app-wide config context),
missing MFA (A07 — a feature-availability fact, not a code shape), CVE
severity triage against actual usage (A06 — needs the OSV/npm-audit feed,
already the Dependency Auditor's job), missing auth-event logging / absent
monitoring hooks (A09 — an absence-of-code judgment, not a pattern match),
SSRF allowlist-bypass via DNS rebinding or redirect chains (A10 — needs
post-resolution runtime state, not static text).

Concept-ontology note (continued): `a06-known-vulnerable-package` uses
`concept: dependency_supply_chain`, a new key not yet in
`concept-ontology-seed.yaml` (no existing key fits "package manifest /
supply-chain" cleanly) — same "flag for whoever expands the ontology next"
situation as `code_quality` above, not an edit to the ontology file itself.

## slop-scorecard's 6 checks → AST rules (W1-06)

Ported from `~/Code/slop-scorecard/src/checks/*.ts`, the free CLI's 6
regex/heuristic checks. Only one of the six is a single-file structural/text
shape; the other five each depend on state outside the one file being
scanned (a second file's declared contents, the rest of the tree, or a live
network response) — Opengrep OSS and ast-grep have no cross-file join or
network-call capability (that class of feature is Semgrep Pro / proprietary,
barred by this repo's licensing guardrail), so force-fitting them into a
single-file rule would either miss the real signal or produce an `.ok`
fixture that can only stay clean by testing something else entirely.

| Check | Status | Notes |
|-------|--------|-------|
| secrets | ported (opengrep) | `packs/secrets/stripe-secret-key.yaml`, `github-token.yaml`, `slack-token.yaml`, `pem-private-key.yaml` — the 4 of 6 `secrets.ts` patterns not already covered by `packs/secrets/hardcoded-credentials.yaml` (AWS key ID, generic secret-shaped assignment). Opengrep `language: generic` + `pattern-regex`, not ast-grep — ast-grep requires a per-language tree-sitter grammar and has no `generic` text-matching language, so these stay in the existing opengrep-engine pack (matches the AWS/generic rules already there) rather than moving to `astgrep/`. |
| phantom-imports | **tool-tier, deferred** | The structural half (extracting an import specifier from a file) is trivial AST work, but the check's actual signal — "is this package name *absent* from `package.json` dependencies/devDependencies" — is a set-difference against a second file's content. Neither engine can read a second file from within a rule. Unlike R-03/R-09 (ANTI_SLOP, W1-01) there's no always-true structural core to narrow to: every import statement is either phantom or not depending entirely on the sibling `package.json`, so no fixed pattern can discriminate `.vuln` from `.ok` without that join. Stays exactly where `slop-scorecard` already runs it (a small Node script comparing import specifiers to `package.json`). |
| dead-exports | **tool-tier, deferred** | Cross-file by definition — "is this exported name referenced anywhere else in the tree" requires scanning every other file, the same shape as ANTI_SLOP R-07 (single-use helper functions, W1-01). A per-file ast-grep rule has no cross-file aggregation. |
| duplication | **tool-tier, deferred** | Cross-file/cross-block token-window comparison (jscpd/PMD-CPD class), the same shape as ANTI_SLOP R-19 (W1-02) and already covered elsewhere in the pipeline by the Duplication Detector agent's jscpd run. Not force-fit into a single-file pattern. |
| hallucinatedDeps | **tool-tier, deferred** | Requires a live HTTP call to `registry.npmjs.org` per dependency to check for a 404. No static rule can make a network call; this is inherently a runtime/CLI check, not a pattern match. |
| dependencyRisk | **tool-tier, deferred** | Requires a live HTTP call to `api.osv.dev` per pinned dependency plus comparison against `dist-tags.latest`. Same network-dependency reasoning as `hallucinatedDeps`. |

Concept-ontology note (continued): the 4 new secret rules reuse
`concept: secrets_config`, the existing key `bpm-secret-aws-access-key` /
`bpm-secret-generic-assignment` already use — no new key needed.
