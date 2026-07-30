# Token cost, measured — four mechanisms, and why the reference standard was wrong

**2026-07-30, second revision.** The first version of this document reported a
**−0.4%** token change and titled itself *"the CPU tier does not cut LLM tokens."*

That measurement is correct and the title was wrong. **The experiment was
structurally incapable of measuring the thing the CPU-first program was built
to do.** This revision states the flaw, re-measures properly, and reports a
finding that undercuts the program's *reference standard* rather than its
premise.

---

## 1. The design flaw, stated plainly

The A/B was:

| Arm | Setup |
|---|---|
| A | LLM reviews everything |
| B | LLM reviews everything, **and is told what the CPU already found** |

**Both arms invoke all five reviewers.** The saving CPU-first was designed to
produce — *don't invoke a reviewer for classes the CPU already covers* — was
held constant in both arms. A −0.4% result was guaranteed by the design.

The quote the first revision offered as the *explanation* —

> "I still had to read all 25 source files end-to-end line-by-line to find what
> the scanner couldn't."

— is not a finding about CPU-first. **It is the design flaw appearing as a
result.** The reviewer read everything because it was asked to review everything.

The lesson generalises: **an experiment that holds the treatment constant
measures the experimenter, not the treatment.** Both arms here paid for
comprehension; only enumeration varied; enumeration is 8% of the bill.

## 2. There are FOUR mechanisms, not two

| # | Mechanism | What it changes | Measured |
|---|---|---|---|
| 1 | **Suppress findings** — tell the reviewer what the CPU found | the OUTPUT | **−0.4%. Dead.** |
| 2 | **Retire reviewers** — never invoke the LLM for covered classes | *whether you pay at all* | **20% per domain; 100% at CPU-only** (§4) |
| 3 | **Deduplicate comprehension** — one reviewer, five lenses | how often you re-read | **77% cut** (§5) |
| 4 | **Bound input** — ranked packet instead of whole file | the INPUT | **65.4% combined / 70.1% Tier-2** (CodeReckon `docs/METHODOLOGY.md`) |

Mechanism 1 is the only one the first revision tested, and the only dead one.

**Mechanisms 3 and 4 must not be costed as additive.** Both attack comprehension
cost. Multi-lens works because 25 files fit one context window; a 500-file repo
does not, and at that scale you are back to packets. They are plausibly *the same
lever measured at different scales*.

## 3. Where the money actually goes

Five reviewers, same 25 files, five separate invocations:

| domain | findings | tokens |
|---|---|---|
| performance | 9 | 119,936 |
| logging | 9 | 120,782 |
| security | 5 | 121,923 |
| slop | 14 | 124,240 |
| codehealth | 15 | 132,679 |
| **total** | **52** | **619,560** |

**Finding count varies 3×. Cost varies 10%.** That is the signature of a large
fixed cost with a small variable one.

Least-squares over the five points: comprehension ≈ **114k per invocation**,
enumeration ≈ **926 tokens per finding**. On that fit, **73.8% of the bill is
re-reading the same 25 files four extra times.**

**Stated honestly: n=5, R² = 0.54, and leave-one-out swings the intercept 11.6%
(105,773–119,045). The defensible range is 68–77%, not a point estimate.**

The model-free version needs no fit and is what should be quoted: the cheapest
single run is 119,936 of a 619,560 bill, so **at most 19% is irreducible
per-read cost and ≥80% is in principle removable.**

## 4. Mechanism 2 — the elimination frontier

What the first revision should have measured. Retire reviewers best-covered
first; costs and coverage both from round-1 data.

| retired | tokens | **cut** | findings lost | weighted value lost |
|---|---|---|---|---|
| — (today) | 619,560 | 0% | 0 | 0% |
| slop | 495,320 | **20%** | 6 | 13% |
| + logging | 374,538 | **40%** | 10 | 19% |
| + codehealth | 241,859 | **61%** | 18 | 32% |
| + performance | 121,923 | **80%** | 24 | 43% |
| + security → **CPU-only** | **0** | **100%** | 28 | 52% |

**The CPU-only product is a 100% token cut, not −0.4%.** A customer who stops at
the CPU tier pays nothing. That tier is the "simple uplift"; deep review is the
upsell. The first revision never modelled this and it is the whole point of the
program.

One hypothesis this **killed**: severity-weighted retention (48%) lands on top of
count retention (46%), so "the LLM finds the valuable ones and the CPU finds the
boring ones" is **not supported**. Weak evidence — severity was self-assigned by
the model that produced the findings.

## 5. Mechanism 3 — one reviewer, five lenses

Arm C: a single invocation carrying all five lenses, same repo, same output
contract, same verbatim-quote requirement.

| | tokens | findings | tokens/finding |
|---|---|---|---|
| five separate reviewers | 619,560 | 52 | 11,915 |
| **one reviewer, five lenses** | **141,066** | **37** | **3,813** |
| | **−77.2%** | −29% | **3.1× more efficient** |

37/37 findings passed the verbatim-quote check. Zero hallucinations.

**But "zero findings lost" — which §3 predicted — is false.** Arm C reproduced
only **21 of the baseline's 52 (40%)**, and attention dilution is visible and
uneven:

| lens | baseline | Arm C emitted | baseline reproduced |
|---|---|---|---|
| security | 5 | 8 | **5/5 (100%)** |
| slop | 14 | 9 | 7/14 (50%) |
| performance | 9 | 5 | 3/9 (33%) |
| logging | 9 | 4 | 3/9 (33%) |
| codehealth | 15 | 11 | **3/15 (20%)** |

Security did not dilute at all — it got *better*. Codehealth collapsed. The
codehealth misses cluster hard on **enumerable sweeps** (four "X has no tests"
findings, three "unnamed magic number" findings): a dedicated pass enumerates a
class exhaustively, a diffuse pass samples it. That is the real shape of
dilution — not a uniform drop.

## 6. The finding that matters most — the reference standard is a sample

Arm C also found **16 findings the five-run baseline missed entirely**, several
of them deep and behavioural:

- `src/extract/rank.ts:145` — the regex-escaping character class is
  double-escaped and matches nothing, so the escape call is a **no-op**
- `src/engines/http.ts:39` — every parsed SERP document is given the base URL
  `https://example.com/`, corrupting relative links
- `src/index.ts:65` — the `Promise.race` timeout timer is never cleared
- `src/fetch/domainLimit.ts:39` — read-sleep-write race: concurrent callers all
  sleep the same interval and fire together

So:

```
baseline 52  +  Arm C 37  −  overlap 20  =  UNION 69
overlap between two independent runs on the same 25 files:  29%
```

**Two competent LLM reviews of the same small codebase agree on 29% of what they
find.** Neither is a subset of the other. **LLM review is a sample from an
unknown defect population, not an enumeration of it.**

That breaks the metric this whole program has been steering by:

| CPU catch-rate measured against | value |
|---|---|
| the round-1 baseline (52) | **46.2%** |
| Arm C (37) | **35.1%** |
| the union of both (69) | **40.6%** |

Same repo, same CPU tier, three different answers. **The 46.2% quoted in
`MEMORY.md` and in the program's material is an artifact of which sample happened
to be the reference.** And the denominator keeps growing: each additional LLM run
adds ~16 findings the CPU mostly does not catch.

### What this means for calibration

**You cannot calibrate a CPU tier against a single LLM run.** The two honest
options:

1. **Ground-truth corpora** — labelled defects, no LLM in the loop. We have
   these, and they are brutal: `ossf-cve-benchmark` real CVEs sit at **0.103
   recall**, against 40–46% "coverage" measured LLM-to-LLM. The gap between those
   two numbers is the size of the self-deception.
2. **Union/consensus across N independent runs** — more expensive, still not
   ground truth, but at least it stops flattering whichever run went first.

The corpus number is the real one. **The LLM-relative number should be reported
as agreement, never as coverage.**

## 7. What must change in the claims

**Retracted:**
- "~70–90% token cut" — never supported.
- "the CPU tier does not cut LLM tokens" — *this document's own previous title*.
  It does; the earlier experiment tested the wrong mechanism.
- **"CPU catch-rate 46.2%"** — sample-dependent. Use 40.6% against the union, and
  label it *agreement*, not coverage.

**Defensible:**
- CPU-only delivers a **100% token cut** and retains ~48% of one LLM run's
  severity-weighted findings — **but that retention figure is against UNTRIAGED
  output** and must not be quoted to a buyer until triaged. Shipwright's dogfood
  went 55 findings → 16 claims → **4 real**.
- **Multi-lens review is 3.1× more token-efficient per finding** than one
  reviewer per domain, at 77% lower cost — while sampling a *different* part of
  the defect population, not a subset.
- Packets cut input **65.4%** (CodeReckon, byte-parity suite).
- CPU-first gives continuous coverage between audits at zero marginal cost.
  `identical-ternary-branches` found five real dead conditionals in ThreatForge,
  a production system no LLM had reviewed.

**Still untested:** whether mechanisms 2, 3 and 4 compound. Given that 3 and 4
attack the same cost, assume they do not until measured.

## 8. Method note

Everything in §3, §4 and §6 was computed from artifacts already on disk at zero
token cost. Only §5 required an LLM call — one, at 141k. The rule stands:
**mechanize the analysis, spend tokens only on the irreducible experiment.**
