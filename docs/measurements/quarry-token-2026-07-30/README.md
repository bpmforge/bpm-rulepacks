# Quarry token measurement — raw data (2026-07-30)

The data behind `docs/TOKEN_COST_MEASURED.md`. Committed so the numbers in that
document can be re-derived rather than taken on trust.

```bash
node frontier.mjs     # mechanism 2 — the elimination frontier
node armC-score.mjs   # mechanism 3 — multi-lens vs the five-run baseline
```

Both run offline, need no LLM, and reproduce every table in §4 and §5.

| file | what it is |
|---|---|
| `findings-{security,slop,performance,codehealth,logging}.json` | **Arm A** — five reviewers, one per domain, five invocations. 52 findings, 619,560 tokens. |
| `findings-multilens.json` | **Arm C** — one reviewer, five lenses, one invocation. 37 findings, 141,066 tokens. |
| `negative-space.md` | Arm C's per-lens "what I looked for and did not find". |
| `diff-now.md` | CPU-vs-Arm-A differential; `frontier.mjs` parses the LLM-only table from it. |

## Cost per invocation

Arm A, measured: performance 119,936 · logging 120,782 · security 121,923 ·
slop 124,240 · codehealth 132,679. Arm C: 141,066.

These are hardcoded in `frontier.mjs`. They are the one input that cannot be
re-derived from the artifacts here — they came from the agent-runner's usage
accounting at the time of each run.

## Two cautions before reusing these numbers

**The finding sets are samples, not enumerations.** Arm A and Arm C overlap on
only 29% of their union (69 distinct findings). Neither is ground truth. A
"CPU catch-rate" computed against either one alone is an artifact of which
sample was chosen — it reads 46.2% against Arm A, 35.1% against Arm C, 40.6%
against the union.

**Nothing here is triaged.** Shipwright's dogfood board went 55 findings → 16
claims → 4 real. Any retention or coverage percentage derived from this
directory is over untriaged reviewer output and must not be quoted externally.
