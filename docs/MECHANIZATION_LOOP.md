# The mechanization loop

How an LLM finding becomes a mechanical detector that finds the same defect on
every repository, forever, for free.

The premise: an LLM reviewing code produces two kinds of finding. Some are
**structural** — the defect has a shape, and a machine can match that shape.
Some are **judgment** — the defect is "this blocklist is incomplete" or "this
comment describes a flag that does not exist", and no pattern will ever decide
it. The loop exists to move everything in the first category out of the LLM's
job and leave it only the second.

---

## The twelve steps

### 1. CPU baseline FIRST, before the LLM sees anything

```bash
npm run scan -- <repo>              # opengrep + ast-grep, merged SARIF
node detectors/manifest.mjs <repo>  # non-pattern detectors
```

Record it. This is the "before" number, and it must be taken before the review
so the comparison is honest.

It also earns its keep immediately: on the first unfamiliar repo we scanned, a
rule shipped hours earlier — fixture-green and swept across eight repos — fired
on `ctx.request.get(url)` in a web-search library with no database, because its
receiver regex `.*(db|…|tx|Tx|…).*` matched the `tx` inside **`ctx`**. A new
codebase is the only thing that finds that class of defect.

### 2. The LLM reviews, under a contract

One reviewer per domain — security, AI slop, performance, code health, logging —
each working from source, none of them shown the CPU baseline. Priming the
reviewer with what the CPU already found makes the overlap you measure
meaningless.

**Two requirements, both non-negotiable:**

| Requirement | Why |
|---|---|
| every finding carries `file` + `line` | no location, no join, no rule |
| every finding **quotes the source line verbatim** | makes step 3 possible |

The quote requirement is what separates this from a normal review. A prior audit
in this fleet reported a HIGH-severity command injection in `tools/grep-mcp.ts`
with evidence reading *"grep-mcp.ts likely contains:"*. The file was not in the
tree. Without the quote, that finding enters the backlog and becomes a rule for
a defect that never existed.

Also ask each reviewer for **what it looked for and did NOT find**. That negative
space tells you which rules would be measuring nothing on this repo, and it is
the cheapest thing in the whole process to collect.

### 3. Ground every finding mechanically

```bash
node scripts/verify-findings.mjs <repo> <findings-dir> --sarif llm.sarif
```

Re-reads each cited line and checks the quote is actually there. Five verdicts:
`VERIFIED`, `DRIFTED` (real code, wrong line — kept, line corrected),
`NOT-IN-FILE`, `NO-FILE`, `NO-QUOTE`. Only the first two reach the SARIF.

Costs nothing. Rules out the entire hallucination class. On the Quarry run:
**52 of 52 VERIFIED.**

### 4. Differential

```bash
node scripts/differential.mjs <repo> --llm llm.sarif --md report.md
```

| Bucket | Meaning |
|---|---|
| **BOTH** | covered — stop paying the LLM for this class |
| **LLM ONLY** | the mechanization backlog. The output that matters |
| **CPU ONLY** | a CPU false positive *or* an LLM recall gap — triage before claiming either |

Matching is **range containment**, not point proximity. A CPU finding about a
block spans `startLine..endLine`; a reviewer pointing at the `catch` line 9
lines below the `try` is describing the same defect. Point matching understated
the first real run by 3×.

### 5. Triage before mechanizing — the gate

**The LLM is not ground truth.** Shipwright's own dogfood went 55 findings → 16
distinct claims → **4 real**. Eleven "CRITICAL" findings were one claim repeated
by eleven specialists, and it was a false positive.

Every row in the LLM-only bucket is a **candidate**. Mechanizing without triage
builds detectors for hallucinations and then scores them as recall.

### 6. Classify: mechanizable, or judgment?

For each real finding, ask *"what would have caught this?"* The answer falls
into one of four tiers:

| Tier | Test | Example |
|---|---|---|
| **Pattern** | the defect has a fixed syntactic shape | `\Z` in a JS regex; `cond ? X : X`; `new RegExp` in a loop |
| **Structural** | needs an enclosing-context check | sync fs *inside an async function*; catch with no binding |
| **Graph** | needs the call/import graph | "only tests reference this"; sync I/O *reachable from* an async caller |
| **Judgment** | needs to know what *should* be there | "this blocklist is incomplete"; "no correlation id in the data contract" |

Tiers 1–2 are rules. Tier 3 is a detector (`detectors/`). **Tier 4 stays with
the LLM permanently and should be recorded as such**, not left looking like
unfinished work.

### 7. Fixture pair FIRST, and confirm RED

Write `.vuln` and `.ok` before touching a rule, and **watch the `.vuln` fail**.
A fixture written after the rule encodes the rule rather than the defect.

The `.ok` file must pin the real boundary. For `regexp-constructed-in-loop`
that means a RegExp *used* inside a loop but *constructed* outside it — the
exact line the rule must not cross.

### 8. Build → GREEN

Engine choice follows the repo's existing convention: **structural → ast-grep,
dataflow/taint → opengrep**. Where both work, prefer the one that expresses the
constraint natively rather than by regex.

### 9. Prove it generalizes — the fleet sweep

```bash
npm run report -- <rule.yaml> --snapshot
```

Fixtures, per-corpus TP/FP, a sweep across every repo in
`scripts/sweep-repos.json`, every finding with its matched line, and the **FP
delta** against the last snapshot.

**A rule that only fires on the repo that motivated it is overfitting, not
mechanization.** The proof it worked: `identical-ternary-branches`, written from
one Quarry finding, immediately found five real dead conditionals in ThreatForge —
a production system nobody had run an LLM over.

### 10. Decide volume by ranking, never by dropping true positives

When a correct rule is noisy, the temptation is to narrow it. Measure first.

`catch-discards-error` fires 275 times in ThreatForge. A narrowing — require an
`await` in the try block — cuts it to 115 and Quarry 20→2. **It was rejected**,
because it also drops `cache.ts:51`, one of the real findings the rule exists to
catch, whose I/O is synchronous.

Cutting volume by dropping true positives is how a rule ends up looking clean
and finding nothing. Set `confidence`, record the measured volume in the rule's
own metadata, and fix prioritisation with ranking.

### 11. Provenance, then commit

Every derived rule carries `provenance: derived:<repo>/<finding-id>`. The
flywheel stays auditable: at any point you can say which rules came from
observed behaviour, which were authored blind, and which finding justified each.

### 12. Re-measure, and isolate the rules from the harness

Re-run step 4. **Then run it again with the new pack removed**, so you know how
much of the improvement is detection and how much is a harness fix.

This matters more than it sounds. On the Quarry round the headline moved
7.7% → 42.3%, but two of the three jumps were measurement bugs in the harness.
The honest attribution:

| | catch-rate |
|---|---|
| as first reported (broken matcher, ast-grep pass missing) | 7.7% |
| **corrected harness, no new rules** — the true "before" | **21.2%** |
| **corrected harness + 5 derived rules** | **42.3%** |

The five rules doubled real coverage. The rest was us mis-measuring ourselves.

---

## Round 2 onward

Same loop, new repo, with the CPU baseline in step 1 now including everything
built so far. Two rules:

1. **Generalize, do not port.** A rule earns its place by matching the *shape*
   of the defect. If it needs the second repo's naming to fire, it was
   overfitted to the first.
2. **The backlog shrinks toward judgment.** As the mechanizable classes get
   built, the LLM-only bucket should converge on tier 4. When a round produces
   only tier-4 findings, that domain is done — the LLM is doing the part only it
   can do.

## What this does and does not claim

**It does** increase measured CPU coverage of what an LLM finds, and the rules
pay forward onto repos no LLM has reviewed.

**It does not yet claim a token saving.** Coverage overlap is not the same as
tokens saved, and we have not measured the second. Doing so needs a review run
where the covered classes are skipped, compared against a full pass. Until that
number exists, "the CPU tier covers 42.3% of what the LLM found on Quarry" is
the honest statement, and "we cut LLM cost by X%" is not.
