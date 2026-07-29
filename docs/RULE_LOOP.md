# The rule loop — one defect at a time, measured every time

How a missed defect becomes a shipped rule. Ten steps, then two loops that run
them: a **build loop** that grinds the queue, and a **challenge loop** that
tries to prove each fix wrong before it counts.

The whole design assumption: **a rule is not done because it fires on the
fixture I wrote for it.** It is done when the corpus number moves, no other
corpus regresses, and an adversary failed to show it was overfitted.

---

## The ten steps

| # | Step | Command | The failure it prevents |
|---|---|---|---|
| 1 | List the misses | `npm run misses -- sampleco` | working on what feels important |
| 2 | Take **one** | `npm run misses -- sampleco --one` | half-fixing five things |
| 3 | **Diagnose** — read the existing rule | — | writing a new rule when one exists and is merely too narrow |
| 4 | Write the **fixture pair first** | `fixtures/<pack>/<slug>.{vuln,ok}.<ext>` | a fixture that agrees with the rule because it was written after it |
| 5 | Confirm **RED** | `npm test -- --only <pack>/<slug>` | [a test that cannot fail](#step-5-is-not-optional) |
| 6 | Fix the rule → **GREEN** | same command | — |
| 7 | Re-score the corpus | `npm run score -- sampleco` | fixture passes, ground truth unmoved |
| 8 | Gate every other corpus | `npm run gate` | buying recall with false positives elsewhere |
| 9 | **Challenge** the fix | `npm run report -- <rule.yaml>` | a rule that matches the sample repo's exact text |
| 10 | Commit | — | — |

### Step 5 is not optional

Run the fixture **before** the fix and watch it fail. A fixture written after
the rule tends to encode the rule rather than the defect, and then it reports
coverage it does not have. If a fixture cannot be made to fail, it is not a
test.

### Step 7 is the one people skip

Steps 5–6 prove the rule fires on *your* example. Step 7 proves it fires on
*the real defect*. These come apart constantly — the D2 rewrite below passed a
hand fixture in an early draft while still missing SampleCo, because the
fixture reproduced the concatenation but not the sqlite3 sink.

---

## Worked example — D2, start to finish

**1–2. The miss.** `npm run misses -- sampleco --one`:

```
D2  (2 sites)  CWE-89
  SQLi: concat into var, then db.all(q)
    src/services/invoiceService.js:7
    src/services/invoiceService.js:12
```

**3. Diagnose.** A JS SQLi rule already existed, so this was a recall bug, not
a gap. `a03-sql-string-concat.yaml` was:

```yaml
pattern-either:
  - pattern: $DB.query(`...${$VAR}...`)
  - pattern: $DB.query($SQL + $VAR)
  - pattern: $DB.execute(`...${$VAR}...`)
```

against:

```js
const q = "SELECT * FROM invoices WHERE customer_id = '" + customerId + "'";
db.all(q, [], cb);
```

Two independent defects, both general:
- **The sink list was wrong for sqlite3.** It knew `query`/`execute`; node-sqlite3
  uses `all`/`run`/`get`/`each`/`exec`/`prepare`. Every sqlite3 app was invisible.
- **The pattern required the concatenation to be inline at the call site.** One
  variable hop defeated it — and building the query into a local first is how
  most real code is written.

The second is the one that matters: widening the sink list alone would still
have missed the defect while looking like a fix.

**4–5. Fixture first, RED confirmed.** A `.vuln.js` reproducing the via-a-local
shape, and an `.ok.js` using the *same driver, same sinks, same local* but
parameterized — so the fixture pins the concatenation as the defect rather than
the use of `db.all`.

```
FAIL  a03-sql-string-concat-sqlite-js.vuln.js expected FIRE, got 0 match(es)
```

**6. Fix → GREEN.** Rewritten to `mode: taint`, which follows the local. Two
findings from the rewrite worth keeping:

- **`pattern-regex` is silently inert inside a taint source** (opengrep 1.25.0).
  A source of `{pattern: <template literal>, pattern-regex: 'SELECT'}` matches
  *nothing* against a template that plainly contains SELECT, while the same
  pattern alone matches. `metavariable-regex` and `pattern-not-regex` both work
  there. Found by isolating each constraint against a fixture, not by reading
  docs.
- **Sinks split into two tiers.** `query`/`execute`/`raw`/`all`/`each`/`exec`/
  `prepare` stand alone. `get` and `run` are far too common (`cache.get(...)`,
  `map.get(...)`) and are gated on a database-shaped receiver name — the same
  disambiguation the Gin/Echo rules already use.
- **`focus-metavariable: $SINK`** on every sink, because opengrep flags a
  multi-argument sink when *any* captured metavariable is tainted. Without it
  the parameterized `.ok` form `db.all(q, [customerId], cb)` fires on its bind
  array. This landmine is documented three times in `CORPUS.md` and has now bitten
  a fourth rule.

**7. Corpus moved.** sampleco labels covered 3 → 4 of 16 in ledger terms
D2 caught; and juice-shop — a real-world app, not the sample — gained recall
too, which is the first evidence the fix generalizes.

**8. No regression.** All other corpora Δ+0.000 or better.

**9. Challenge.** See below. The generalization evidence here is juice-shop:
the rule was written against SampleCo and improved an unrelated corpus.

---

## Steps 1-8 are mechanical. Do not spend a model on them.

`npm run report -- <rule.yaml>` emits the whole evaluation: fixture RED/GREEN,
per-corpus TP/FP/crossTaxonomy for that rule, a sweep across every repo in
`scripts/sweep-repos.json`, every finding with its matched line, and — with
`--snapshot` — the **FP delta** against the last run, naming exactly which
findings a rule change added and removed.

That delta is the number that matters and the one that kept being derived by
hand: copy the old rule to a temp file, scan N repos twice, diff the counts.
Three loop iterations in a row an agent was asked to "run an FP sweep and
classify every finding", and each burned 150–230k tokens and 130–210 tool calls
re-deriving that same procedure. It is a loop over a list, not judgment. Paying
a model to improvise it — inside the toolchain built to stop paying models for
mechanical work — is the failure this whole program exists to remove.

**The only step a script cannot do is deciding whether a finding is real.** The
report stops exactly there and hands over a table to mark up. Verified by
re-widening `express-route-body-no-validation`: the delta reported +5/-0 and
named all five false positives, identically to the manual sweep that had cost an
agent its entire context.

A missing repo is reported `MISSING`, never skipped silently — a sweep that
scanned three of eight repos and printed "0 findings" would read as a clean bill
of health it never earned.

## The build loop ("Ralph Wiggum")

Same prompt, over and over, until the queue is empty. The loop does not get
smarter between iterations — that is the point. Each iteration is a fresh
context doing one small, fully-specified job, so nothing accumulates and
nothing drifts.

```bash
scripts/rule-loop.sh sampleco          # until no misses remain
scripts/rule-loop.sh sampleco 3        # at most 3 iterations
```

Each iteration: read the next miss → do steps 3–8 → hand the result to the
challenge loop → commit only if the challenge passes.

**Termination is measured, not assumed.** The loop re-scores after every
iteration and stops when `covered == total`, when an iteration fails to move
the number, or when the iteration cap is hit. An iteration that does not move
coverage is reported as a **stall**, not retried silently — a rule that "fixed"
a defect without moving ground truth did not fix it.

## The challenge loop

The build agent is the worst judge of whether its own rule generalizes. After
each fix, independent reviewers try to **refute** it. Default to refuted when
uncertain — a rule that survives a skeptic is worth more than one that survives
its author.

Three lenses, because a rule can fail in more than one way:

| Lens | The question | Refutation looks like |
|---|---|---|
| **Overfit** | Would this fire on the same defect written differently — other driver, other variable names, other file? | the pattern reproduces SampleCo's literal text |
| **False positive** | What *safe* code does this now flag? | a plausible clean snippet that fires |
| **Test integrity** | Could the fixture actually fail? Does `.ok` pin the boundary or just differ? | `.ok` differs in something irrelevant to the rule |

A fix ships when at least two of three lenses fail to refute it. The overfit
lens is the one with teeth: it is answered by writing a *fresh* variant of the
defect the rule has never seen and checking the rule still fires.

---

## When coverage does not move, suspect the scorer too

Step 7 says a fix that does not move coverage did not fix the defect. That is the
right default — and iteration 1 of the loop found the exception, which is worth
stating precisely so nobody grinds on a phantom.

D1b (`jwtSecret` at `config.js:6`) was genuinely fixed: the rule went from
matching nothing on that line to producing a new, correctly-tagged finding.
Coverage stayed at 4/16 anyway. The cause was in the matcher, not the rule:

```
finding line 5 -> credited to D1
finding line 6 -> credited to D1     <- D1b can never be covered
distinct labels covered: 1 of 2
```

`vuln.find()` took the **first** label within the ±2 line window. D1 (line 5)
and D1b (line 6) share a file and a CWE and sit one line apart, so both findings
were credited to D1 and D1b was unreachable *by construction* — no rule
improvement could ever have covered it. Fixed by preferring an **unclaimed**
label, then the nearest line.

**The discriminator between "unfixed defect" and "unscoreable label":** check
whether the detection changed at all, independently of the score. Run the single
rule against the single file and count findings before and after. If detections
increased and coverage did not, the label is unreachable — that is a scorer
defect, and it must be filed rather than worked around.

The build agent that hit this reported it as a scorer bug instead of claiming a
win or silently retrying. That is the behaviour the loop needs: **an iteration
that cannot demonstrate its result should say so.**

## What the loop must never do

- **Rebaseline to go green.** A red gate means fix the rule. The only legitimate
  rebaseline is an improvement or a corrected metric, committed deliberately
  with the delta in the message.
- **Count a fixture as coverage.** Step 7 or it did not happen.
- **Quote a precision number from a corpus with no safe labels.** The scorer
  refuses to compute one; do not reintroduce it downstream.
- **Trust a zero.** Zero findings is a detection result *and* a traversal
  failure, and they look identical. Three variants have bitten this repo
  already: a non-git payload, an extracted zip, and a symlink.
