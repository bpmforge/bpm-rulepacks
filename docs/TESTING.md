# Testing rulesets & semantic greps

Two independent things get tested, with two different harnesses. Don't conflate them.

| | **Tier 1 — Correctness** | **Tier 2 — Quality at scale** |
|---|---|---|
| Question | Does rule X fire on bad code and stay silent on good code? | Across thousands of real files, what's the rule's precision/recall? |
| Corpus | Our own hand-written `fixtures/` (vuln + ok pairs, one per rule) | Pinned open-source **labeled** vulnerable codebases + NIST Juliet |
| Speed | Milliseconds; runs on every commit / in CI | Minutes; runs nightly or pre-release, not per-commit |
| Gate | **Hard** — a rule with a failing fixture cannot merge | **Regression** — a rule that drops precision/recall vs the last baseline is flagged |
| Ground truth | You wrote it (you know the answer) | Published labels (CWE-tagged lines/files, expected-results CSVs) |
| Status | ✅ built (`scripts/test-rules.mjs`) | 🔧 this doc + `scripts/score-corpus.mjs` |

Tier 1 proves a rule *works*. Tier 2 proves it *doesn't cry wolf* on real code — the thing that actually kills a paid audit's credibility.

## The authoring loop (every rule)

```
1. Write the RED fixture:  fixtures/<pack>/<slug>.vuln.<ext>   (rule MUST fire)
2. Write the GREEN fixture: fixtures/<pack>/<slug>.ok.<ext>    (near-identical safe code — rule MUST NOT fire)
3. Author the rule:        packs/<pack>/*.yaml  or  astgrep/<pack>/*.yaml
4. Register the case in scripts/test-rules.mjs
5. `npm run check`         (provenance validator + RED/GREEN runner) → must pass
6. Score against corpus:   `npm run score -- --rule <id>` → precision/recall recorded
7. If precision dropped:   tighten pattern (add pattern-not / metavariable guards), goto 3
```

RED first. A rule with no `.ok` fixture is not done — the `.ok` case is what catches the false positive that a paid client will notice. This is the same RED/GREEN discipline the expert system enforces (planted-defect testing).

## Tier 2 — the corpus harness

### Why open repos
Hand fixtures can't tell you a rule's false-positive rate on real code — real code has the weird-but-safe patterns that trip naive rules. So we score against **labeled** vulnerable codebases where someone already published which lines are vulnerable and to which CWE. That gives true positives / false positives / false negatives → precision, recall, F-score per rule and per pack.

### Licensing rule (same as everything else)
Test corpora are **referenced by pinned commit, never vendored** into this repo. Two reasons: (1) size, (2) license — some vulnerable-app corpora are GPL/AGPL and must not live inside a proprietary repo. *Running our scanner over a repo* is fine regardless of its license; *copying it into our product* is not. `corpus/corpus.lock` pins each by URL + commit SHA + SPDX license + a `vendor: false` flag enforced by the fetch script. Licenses are verified in `docs/CORPUS.md` (pending research — do not add a corpus without a confirmed permissive-or-use-only license).

### Layout
```
corpus/
  corpus.lock          # pinned corpora: {name, url, sha, license, languages, labels: <path-or-format>}
  fetch.mjs            # clones each pinned corpus to $CORPUS_DIR (default ~/.cache/bpm-rulepacks-corpus), SHA-checked, never vendored
  labels/<name>.json   # normalized ground truth: [{file, line?, cwe, kind}] — adapters convert each corpus's native format (Juliet manifest.xml, OWASP expectedresults.csv, etc.) into this
scripts/
  score-corpus.mjs     # run engine over a fetched corpus, match findings to labels, emit precision/recall/F per rule+pack + a baseline diff
corpus/baselines/<name>.json  # last accepted scores — regression gate compares against this
```

### Ground-truth normalization
Every corpus publishes labels differently (Juliet's `manifest.xml`, OWASP Benchmark's `expectedresults-1.2.csv`, a *Goat app's docs). Each gets a small adapter that emits our normalized `labels/<name>.json`: `[{file, line?, cwe, kind: "vuln"|"safe"}]`. Scoring then matches engine findings (file + line + CWE from rule metadata) against labels:
- finding on a `vuln` label (matching CWE) → **TP**
- finding on a `safe` label → **FP**
- `vuln` label with no finding → **FN**
- precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = harmonic mean.

CWE matching is why every rule carries `metadata.cwe` — it's what links a finding to the corpus label. Rules without CWE can't be corpus-scored (validator warns).

### Regression gate
`score-corpus.mjs` writes `corpus/baselines/<name>.json`. On re-run, a rule whose precision or recall drops more than a threshold vs baseline fails the gate (like Tier 1's RED/GREEN but statistical). New baseline is committed deliberately, with the score delta in the commit message — never silently.

## Semantic grep / retrieval testing (Lodestone — different again)

The concept-ontology + retrieval side isn't pass/fail per finding; it's *ranking* quality. Its harness lives with Lodestone, not here, but the shape:
- **Golden judgments**: `[{query: "where is password handling", relevant: ["auth/hash.ts:12", ...]}]` — hand-labeled on a few pinned repos, seeded from the concept ontology keys.
- **Metrics**: Recall@k, MRR, nDCG — "did the right file surface in the top-k for this concept query?"
- **Gate**: a change to chunking / BM25F weights / ontology that drops Recall@k on the golden set is flagged.
- Optionally adapt a public code-search relevance benchmark (CoIR / CodeSearchNet) for a broader, non-hand-labeled signal.

## What runs where
- **CI (every push):** Tier 1 RED/GREEN + provenance validator. Fast, hermetic, no network.
- **Nightly / pre-release:** `npm run score` over the fetched corpus → precision/recall + regression gate. Needs the corpus cache (fetched once).
- **The learning flywheel:** confirmed findings from real audits become new Tier-1 fixtures; recurring false positives become new `.ok` fixtures. The corpus catches classes of FPs; the fixtures pin the specific ones we've seen.
