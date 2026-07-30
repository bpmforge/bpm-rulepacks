# Token cost, measured — suppressing findings saves nothing; bounding input does

**2026-07-30.** The CPU-first program has been justified by an estimated
"70–90% LLM token cut". The estimate is unsupported — but the correction is more
specific than "there is no saving", and an earlier version of this document got
that wrong.

**There are two different mechanisms and they must not be conflated.**

| Mechanism | What it changes | Measured |
|---|---|---|
| **Suppressing findings** — tell the reviewer what the CPU already found | the OUTPUT it writes | **−0.4%. Nothing.** (below) |
| **Bounding input** — send a ranked evidence packet instead of the whole file | the INPUT it reads | **65.4% combined / 70.1% Tier-2**, and NEGATIVE on tiny files (CodeReckon, `docs/METHODOLOGY.md`) |

The saving is real and it lives entirely in the second row. CodeReckon already
built and measured it — `tools/tier2-triage`, `tools/tier3-synthesis`, with a
parity suite proving the packet-side prompt mirrors are byte-identical to
production. An earlier draft of this file called that lever "untested", which was
simply false: it had been measured before I measured anything.

What this document adds is the other row, which had not been measured: a CPU tier
that only removes findings from the LLM's job saves nothing at all.

---

## The experiment

Same repository (quarry, 32 source files, 4,174 lines), same domain (AI slop),
same output contract, same model. One variable: whether the reviewer was handed
the CPU tier's findings and told to skip those classes.

| | tokens | findings |
|---|---|---|
| **A — naive** (round 1, no CPU input) | 124,240 | 14 |
| **B — CPU-informed** (37 mechanized findings supplied, told to skip them) | **123,746** | **7** |
| delta | **−0.4%** | −50% |

**−0.4% is noise.** Telling a reviewer that a third of the work is already done
did not make it cheaper.

## Why — in the reviewer's own words

> "It let me skip re-deriving and re-verifying ~25 already-confirmed sites…
> **But I still had to read all 25 source files end-to-end line-by-line** to find
> what the scanner *couldn't* — the stale-branding drift, the blacklist with no
> TTL, the silently-discarded API option, the library-reimplementation call. None
> of those are greppable or AST-detectable; they required tracing intent across
> files."

**Token cost in a code review is dominated by comprehension, not enumeration.**
Reading the code is the bill. Writing findings is rounding error. Any strategy
that assumes findings-suppression saves tokens is assuming the wrong cost model.

## What the CPU tier is actually worth

Three things, none of which is a discount on the LLM pass.

**1. The same money buys better findings.** Side B spent the same tokens and
returned 7 judgment findings instead of 14 mostly-mechanizable ones — and found
a real defect side A missed entirely: `SearchOptions.profileDir` is a public API
field that is `Omit`'d before reaching any adapter, so setting it silently does
nothing. That is a better use of an identical budget, and it is a real product
claim: *the LLM stops spending its attention on what a scanner already knows.*

**2. Coverage on repos nobody will pay to review.** Ten house rules and seven
Lodestone metrics run on every commit, on every repo, forever, at zero marginal
cost. `identical-ternary-branches` found five real dead conditionals in
ThreatForge — a production system no LLM had reviewed. That is coverage that
would never have been bought at any price.

**3. It bounds what the LLM must be trusted with.** A finding a scanner
reproduces is a finding you can verify without a second model.

## Per-domain coverage, and why no reviewer can be retired

Retiring a whole reviewer is the only mechanism that would produce a large token
saving — one domain dropped is ~20% of the bill. Measured on quarry:

| Domain | CPU coverage | Round-1 cost |
|---|---|---|
| slop | 8/14 (57%) | 124,240 |
| logging | 5/9 (56%) | 120,782 |
| codehealth | 6/15 (40%) | 132,679 |
| performance | 3/9 (33%) | 119,936 |
| **security** | **1/5 (20%)** | 121,923 |

**Nothing is close to retirable.** At 57% on the best-covered domain, dropping it
loses 43% of its findings. And security — the domain a customer actually buys —
is the least covered, because its findings were blocklist-completeness judgments
no pattern will decide.

## What must change

**`STRATEGY.md` and the CodeReckon material must stop claiming a 70–90% token
cut.** It is not supported, and it is measurable, so a customer or an investor
can falsify it. The defensible claims are:

- CPU-first raises what an audit *finds* at constant LLM cost (quarry: 46.2% of
  LLM findings now reproduced mechanically, from 13.5%).
- CPU-first gives continuous coverage between audits at zero marginal cost.
- CPU-first shifts LLM spend from enumeration to judgment.

**The lever that works is already built.** CodeReckon's packet architecture is
the comprehension-cost lever, and its measured numbers are the ones to quote:
65.4% combined, 70.1% Tier-2 alone, and negative on files small enough that a
bounded excerpt IS the whole file. `target_met: false` against the program's own
≥70% bar, reported honestly there rather than reweighted to clear it.

**So the two programs do different jobs and should be sold differently:**

- **bpm-rulepacks (rules + detectors)** raises what an audit FINDS at constant
  LLM cost, and covers repos between audits at zero marginal cost. It is not a
  token-reduction story and should stop being described as one.
- **CodeReckon (evidence packets)** is the token-reduction story, at a measured
  65.4%, and it does not depend on the rulepack finding anything at all.

The one thing genuinely untested: whether the two compound. Packets bound what
the reviewer reads; the rulepack changes what it is asked about. Nothing measured
so far says the product of the two is better than the packet number alone, and it
should not be assumed.
