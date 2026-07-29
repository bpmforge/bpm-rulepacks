# sampleco labels — hand-derived, 2026-07-29

Ground truth for **CPU-catch-rate**: what fraction of a fully-characterised
AI-slop codebase the rules find with no LLM in the loop.

Source: `~/Code/codereckon/sample/sampleco/PLANTED_DEFECTS.md` (12 defects, D1–D12).
Line numbers were read off the actual files, not copied from the ledger's
"approx line" column.

## Why 16 labels for 12 defects

Four planted defects occupy more than one site, and a rule that finds one site
but not the others has genuinely only found part of the defect:

| Ledger | Labels | Why |
|---|---|---|
| D1 | `D1`, `D1b` | two hardcoded secrets in `config.js` (`apiKey`, `jwtSecret`) |
| D2 | `D2`, `D2b` | two concatenated queries (`findInvoicesByCustomer`, `createInvoice`) |
| D5 | `D5`, `D5b`, `D5c` | the duplication defect is *three* copies; finding one proves nothing |
| D10 | `D10` | pinned separately from D3 — both live in `package.json` |

**Catch-rate is reported over the 12 ledger defects**, not the 16 labels: a
defect counts as caught when any of its labels is hit. The extra labels exist so
partial coverage is visible rather than rounded up.

## What this corpus can and cannot measure

**CAN: recall / CPU-catch-rate.** Every planted defect has a known site.

**CANNOT: precision.** There are **no `safe` labels** — SampleCo has no
deliberately-clean counterpart to each defect the way OWASP Benchmark or Juliet
`good()` functions do. With zero safe labels, `precision` computed from this
corpus would be an artifact of exactly the kind that made Juliet read 1.000
before its safe labels were recovered. The scorer reports findings that land off
a labeled line as `unlabeled` — they are **triage candidates, not scored false
positives**, and a human must read them.

Do not quote a SampleCo precision number. If one appears, the scorer is wrong.

## CWE choices

Several anti-slop defects have no exact CWE. Chosen as the nearest real entry,
recorded here rather than invented silently:

- **D5 duplication → CWE-1041** (Use of Redundant Code). Exact.
- **D7 dead primary path, D8 never-called validator → CWE-561** (Dead Code).
  D8 is really "built-but-unwired" (ANTI_SLOP R-26), which has no CWE; 561 is
  the closest and the taxonomy gap is the point of the R-26 detector work.
- **D12 stale comment → CWE-1116** (Inaccurate Comments). Exact.
- **D3 slopsquat → CWE-1357** (Reliance on Insufficiently Trustworthy Component).
- **D4 phantom import, D10 outdated dep → CWE-1104** (Use of Unmaintained
  Third Party Components). Approximate for D4 — a *nonexistent* import isn't
  quite an unmaintained one, but no better entry exists.
- **D11 unvalidated body → CWE-20** (Improper Input Validation). Exact.

The scorer requires CWE overlap for a true positive, so a rule aimed at one of
these defects must carry the matching CWE in its metadata or it will score zero
even when it fires on the right line.
