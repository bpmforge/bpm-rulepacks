# Grading the house pack — 2026-07-30

Until today **not one of the eleven house rules had been graded for precision.**
The pack's headline 0.89–1.0 was carried entirely by the OWASP and Juliet rules,
which are scored against labelled corpora. The house rules were checked by
fixtures (does it fire on the planted case) and volume sweeps (how many hits) —
neither of which is precision.

The one rule anyone had ever spot-checked came in at **0.12**.

## Corpora cannot do this

Checked first, because it would have been free. `ossf-cve-benchmark` carries
CWE-400 (11 vuln / 11 safe) and CWE-770 (2 / 2) — exactly the CWEs of
`unbounded-response-read`.

**Zero house rules fire on it.** Its CWE-400 cases are a different defect shape.
The security corpora are structurally silent about the house pack, the same way
they are about the slop pack. **Fleet triage is the only path to house-rule
precision**: run the rules over our own repositories and read every hit.

## Result

| rule | before | after | trigger | what was wrong |
|---|---|---|---|---|
| `timing-unsafe-secret-comparison` | **0.23** | 1.00 | name | 4 decidable FP families |
| `sync-fs-in-async-fn` | **0.25** | 1.00 | structural | 9 of 12 were build scripts |
| `unbounded-response-read` | 20 of 51 in class | 20 of 20 | name | answering 3 questions at once |
| `regexp-from-unescaped-interpolation` | ~0.67 | ~0.84 | name | accused the correct code |
| `catch-discards-error` | *claimed 1.00* | 313 of 332 | structural | circular self-grading |
| `async-effect-no-cleanup` | ~0.96 | 1.00 | structural | one empty dep array |
| `prepared-statement-in-loop` | 1.00 | 1.00 | structural | — |
| `regexp-constructed-in-loop` | 1.00 | 1.00 | structural | — |
| `identical-ternary-branches` | 1.00 | 1.00 | structural | — |
| `control-char-in-string-literal` | 1.00 | 1.00 | structural | — |
| `non-js-regex-anchor` | 1.00 | 1.00 | structural | — |

**Fleet volume 479 → 402. No true positive was dropped anywhere.**

## Four findings that generalise

**1. Every rule that failed had already been "measured".** Not one shipped
unchecked. They were measured by sampling 8 of 36 hits, by counting volume
before and after a narrowing, by reasoning about an inline call form, and by
asserting a syntactic fact. **Four of six were badly wrong anyway.** The only
method that worked was reading every hit — sampling hid four entire FP families
in `timing-unsafe-secret-comparison` alone.

**2. Name-based triggers are where the damage is.** The three worst rules all
keyed off identifier names, and each failed because a word means two things:
`signature` is a code symbol *or* an HMAC; `res` is a response *or* a request;
`identTokens` are parser tokens, not credentials. Name-based rules import the
ambiguity of English into the matcher. Every rule that needed no change is
structural.

**3. Structural rules do not misfire — they mis-CLAIM.** `catch-discards-error`
asserted "There are no false positives here", and it was right about the thing
it matched (a catch with no binding cannot reach the error — a syntactic fact)
and wrong about the thing it *reported* (that the failure is silently swallowed —
false for 20 handlers that throw or log). **A rule graded against the property it
matches instead of the defect it claims will always score 1.00.** That is not
precision, it is a tautology.

**4. Volume measurement cannot find conflation.** `unbounded-response-read` was
volume-measured before shipping — that is where its `.json()` exclusion came
from, 316 hits to 68 on ThreatForge. The narrowing fixed the volume and left
untouched the fact that the rule was reporting inbound request bodies under a
message about response bodies. **Counting hits cannot reveal that a rule is
answering three questions. Only reading them can.**

## What is still open

**`catch-discards-error` is 313 of the remaining 402.** Those are genuine silent
swallows — but 313 findings drown a report, which is how
`mem-unsafe-string-functions` became unusable at 18 TP / 700 FP. **This is a
prioritisation problem, not a precision one.** The obvious narrowing stays
rejected: requiring `await` in the try block cuts quarry 20 → 2 but drops
`cache.ts:51`, a real finding on synchronous I/O. Losing true positives to reduce
volume is the wrong trade. It needs ranking — order by whether the try block
performs I/O and whether the handler substitutes a value the caller branches on.
That is a scoring change, not a pattern change.

**Recall is still unmeasured for every house rule.** Everything here is
precision: of what the rule reported, how much was real. Nothing says what the
rules *missed*, and the corpora cannot answer that either.

## Method

For each rule: dump every fleet hit with its source line, cluster mechanically by
shape, triage each cluster, add every false-positive shape to the rule's `.ok`
fixture, then **verify the fixture goes RED with the fix reverted** — a fixture
that passes both ways guards nothing. Re-scan the fleet to confirm the change and
that no true positive disappeared. Gate on all five corpora.

One fix belonged outside the rules entirely: `scan.mjs`'s `TEST_PATH_RE` matched
`tests?` but never a `test-utils` segment. Widening it removed findings about
deliberately-planted test strings from **two** rules — including
`regexp-constructed-in-loop`, which was otherwise untouched.
