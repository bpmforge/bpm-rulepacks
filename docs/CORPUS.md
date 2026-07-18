# Test corpora — verified licenses & decisions (2026-07-16)

Ground-truth labeled vulnerable-code sets we score rules against. **USE** = run our scanner over it and keep aggregate scores (fine for any license — analysis isn't redistribution). **VENDOR** = copy the code into this proprietary repo (only the permissive ones). We reference every corpus by pinned SHA in `corpus.lock` and **never vendor** — so the USE/VENDOR split mostly governs whether labels/derived files may live here (they may, since labels are ours).

## Standardized set (what `corpus.lock` pins)

| # | Corpus | Lang | License | Role | Labels |
|---|---|---|---|---|---|
| 1 | **NIST Juliet / SARD 1.3** | C/C++, Java, C#, PHP | **Public domain + CC0** | Backbone — massive synthetic, line+CWE labeled, the only one we *could* vendor | `manifest.xml` / SARIF: file+line+CWE per flaw |
| 2 | **OWASP Benchmark (Java)** | Java | **GPL-2.0 — USE only, never vendor** | Industry P/R yardstick; has true-negatives (real FP-rate signal) | `expectedresults-1.2.csv`: test→real?(T/F)→CWE |
| 3 | **OWASP Benchmark (Python)** | Python | **GPL-3.0 — USE only** | Python P/R, same model | expectedresults CSV |
| 4 | **OpenSSF CVE Benchmark** | JS/TS | **MIT** | Real-world JS/TS CVEs (not synthetic) | per-CVE file/line metadata |
| 5 | **CWE-Bench-Java** | Java | **MIT** | Real Java CVEs, method-level fix labels | `fix_info.csv` |
| 6 | **OWASP Juice Shop** | JS/TS | **MIT** | Integration target (whole app) | `// vuln-code-snippet` markers → challenges.yml |
| 7 | **DSVW** | Python | **Unlicense (public domain)** | Tiny (~100 lines, ~25 vulns) — fast smoke corpus, hand-labeled | README table → hand `labels/dsvw.json` |

CVEfixes (MIT, polyglot, SQLite from Zenodo) is a **recall spot-check** option for the Go/Python gap — added later; it's a dataset file, not a git clone, so it needs its own fetch path.

## Explicitly excluded (and why)

- **semgrep-rules test fixtures** — Semgrep Rules License v1.0: "only for internal business purposes… may not distribute or make available as a service." We ship a competing paid SAST product; even harness use is the blocked scenario. **Hard no** (same posture as our engine choice).
- **DVWA (GPL-3.0), WebGoat (GPL-2.0), django.nV (GPL-2.0, archived)** — GPL family: USE-able internally but never vendor, and lower-value (prose labels). Not pinned; reach for them only for manual/interactive testing, never in the scored harness.
- **WebGoat.NET** — no license file at all (all-rights-reserved) + dead. Skip.
- **CASTLE** — good design but **no license file** = no rights granted. Watch; don't pin until relicensed.
- **Devign / BigVul / DiverseVul** — ML-training datasets: binary function labels, no sink lines, documented label noise; DiverseVul has no license. Wrong shape for rule P/R. If a research dataset is ever needed, use **PrimeVul (MIT)** only.

## Licensing rule enforced in code

`corpus/fetch.mjs` refuses any lock entry missing an SPDX `license` or marked `vendor:true`. The GPL corpora carry `vendor:false` and are cloned to `$CORPUS_DIR` at test time — their code never enters this repo. Only the **normalized labels** (`corpus/labels/*.json`, derived by our adapters) are committed, and those are our own work product, not the corpus code.

## Baselines established

### owasp-benchmark-java (W2-01, 2026-07-18)

Pipeline proven end-to-end on the first real corpus: `npm run corpus:fetch
owasp-benchmark-java` clones the pinned SHA (GPL-2.0, USE-only, never
vendored) into `$CORPUS_DIR`; `corpus/adapters/owasp-benchmark-java.mjs`
reads `expectedresults-1.2.csv` and emits **2,740 normalized labels**
(1,415 `vuln` / 1,325 `safe`) to `corpus/labels/owasp-benchmark-java.json`;
`npm run score -- owasp-benchmark-java --update-baseline` ran both the
opengrep (`packs/`) and ast-grep (`astgrep/`) rule sets over the corpus and
committed `corpus/baselines/owasp-benchmark-java.json`.

**Baseline: TP=0, FP=0, FN=1415 → precision=n/a, recall=0.000, F1=n/a.**

This is an honest, expected zero, not a bug: every current opengrep rule
declares `languages: [typescript, javascript]` and every ast-grep rule
targets `python`, `ruby`, `typescript`, or `tsx` — **the corpus has zero
Java-targeted rules to score against**. A direct `opengrep scan --config
packs $CORPUS_DIR/owasp-benchmark-java` confirms 0 findings across all
5,707 git-tracked files. The 0.000 recall measures "no Java rule coverage
yet," not rule quality. See `corpus/labels/owasp-benchmark-java.md` for the
full adapter/verification notes.

**Gap this baseline reveals:** Java rule coverage is now the visible
backlog item — the corpus, labels, scorer, and baseline machinery are all
proven and ready; the baseline will move only when a future ticket
authors Java-targeted opengrep/ast-grep rules (out of this ticket's
`write_scope`, which is adapter + labels + baseline only — rules are
authored, tested, and scored in separate tickets by design).

### juliet-cpp (W2-04, 2026-07-18)

Zip-fetch path proven end-to-end on the largest corpus in the fleet — and
the only one whose license (CC0-1.0, public domain) would even permit
vendoring, though we still don't (fetch-to-cache only, per the licensing
rule above). `corpus.lock`'s original URL 404s (a dated NIST filename that
no longer resolves); fixed to the live
`2017-10-01-juliet-test-suite-for-c-cplusplus-v1-3.zip` build on
`samate.nist.gov/SARD/test-suites/112` (HTTP 200 verified) and its sha256
pinned via `PIN_SHA256=1 node corpus/fetch.mjs juliet-cpp`.
`corpus/adapters/juliet.mjs` parses `C/manifest.xml` (file+line+CWE per
flaw) into normalized labels, bounded to `JULIET_PER_CWE_LIMIT` (default
25) flaw-labeled files per CWE folder for breadth across all 118 CWE
categories rather than the full 65,263-flaw manifest — **2,680 vuln
labels, all 118 CWE folders represented**, committed to
`corpus/labels/juliet-cpp.json`. `npm run score -- juliet-cpp
--update-baseline` ran both the opengrep and ast-grep rule sets.

**Baseline: TP=0, FP=0, FN=2680 → precision=n/a, recall=0.000, F1=n/a.**

Honest, expected zero — same shape as `owasp-benchmark-java`'s: every
current rule targets typescript/javascript/python/ruby/tsx, none targets
c/cpp, so 0 findings is exactly right. **This is verified traversal, not
a silent-zero blind spot**: this is the fleet's first `type: zip` corpus
(every prior one was a `git` clone), and the extracted tree is not a git
repo — a landmine the `ossf-cve-benchmark` adapter already hit once
(opengrep/semgrep default to `git ls-files`-tracked files only, and
initially scanned 0 files for that corpus until its non-git payload was
staged into a tracking clone). A direct `opengrep scan --config packs
$CORPUS_DIR/juliet-cpp --verbose` confirms opengrep detects the missing
git repo, falls back to "Running on all files instead," and reports
**"Ran 10 rules on 106089 files: 0 findings"** — real traversal of the
extracted zip, zero findings purely from the c/cpp language mismatch, not
an unscanned tree. This baseline proves the zip-fetch + manifest.xml
adapter + scorer machinery, not rule quality; it also only ever measures
recall (the manifest marks defect lines but not the same-file `good()`
safe variants, so no precision/FP-rate signal is available from this
corpus without further source-marker parsing — see
`corpus/labels/juliet-cpp.md`). Full adapter/verification notes there.

## Retrieval benchmark (Lodestone side)

**CoIR** (Apache-2.0, ACL 2025) is the pick for code-search relevance — standardized qrels, MTEB/BEIR-compatible, covers CosQA/CodeSearchNet subsets. Lives with Lodestone's harness, not here. Avoid vendoring C-UDA data (CoSQA raw); consume it through CoIR.

_Sources verified via GitHub license API + LICENSE files + official pages, July 2026. Full citation list in the research thread._

## Nightly CI (W2-05, 2026-07-18)

`.github/workflows/corpus-scoring.yml` runs nightly (03:17 UTC cron) +
`workflow_dispatch` (optionally scoped to one corpus). It installs Opengrep
(official `install.sh`) and ast-grep (`npm i -g @ast-grep/cli`), fetches each
corpus (`corpus/fetch.mjs`), then runs `npm run score -- <name>` **without**
`--update-baseline` — a regression (precision or recall dropping more than
the scorer's threshold vs the committed baseline) fails the job. Baselines
are never written by CI; they only change via a human-reviewed PR, same as
the rules themselves.

**Corpora scored nightly:** the four with a committed baseline —
`ossf-cve-benchmark`, `owasp-benchmark-java`, `juice-shop` (one shared
30-minute job, matrixed) and `juliet-cpp` (its own 90-minute job — see
below).

**Corpora not yet in nightly:** `owasp-benchmark-python`, `cwe-bench-java`,
`dsvw` are pinned in `corpus/corpus.lock` but have no adapter / normalized
labels / baseline yet (see "Baselines established" above — only 4 of the 7
pinned corpora have made it through that pipeline so far). There is nothing
to regression-gate without a baseline, so the workflow does not fetch or
score them; this is a documented gap, not a silent cap — it closes when a
future ticket ships each one's adapter + first baseline the same way W2-01
and W2-04 did.

**Juliet's size (~146MB zip, ~64k test cases) is handled by inclusion, not
exclusion:** it runs nightly like the others, in its own job with a
90-minute timeout and an `actions/cache` keyed on `corpus.lock`'s pinned
sha256, so only a cold cache (first run, or a corpus.lock bump) pays the
full download+extract cost — subsequent nights restore the cache and skip
straight to scoring. This was the documented choice over making Juliet
`workflow_dispatch`-only/opt-in: the whole point of the nightly gate is
catching a regression before it ships, and Juliet is the fleet's only C/C++
corpus.

A `refresh scorecard summary` job (`needs: [score, score-juliet]`, `if:
always()`) posts the current **committed** scorecard (see below) to the
Actions job summary after every run, for visibility — it reads
`corpus/baselines/*.json` as they exist in the checked-out commit and never
writes back to the repo. When a baseline is deliberately updated via
`--update-baseline` in a PR, run `node scripts/scorecard.mjs` locally and
commit the refreshed `docs/CORPUS.md` section alongside the new baseline.

## Scorecard

<!-- SCORECARD:START (generated by scripts/scorecard.mjs — do not hand-edit) -->

_Generated by `node scripts/scorecard.mjs` from `corpus/baselines/*.json` — rerun after any `--update-baseline` and commit both together._

Rule corpus: **66** rules across 4 packs (opengrep `packs/` + ast-grep `astgrep/` combined per pack).

### By corpus

| Corpus | TP | FP | FN | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| juice-shop | 1 | 0 | 39 | 1.000 | 0.025 | 0.049 |
| juliet-cpp | 0 | 0 | 2680 | n/a | 0.000 | n/a |
| ossf-cve-benchmark | 0 | 0 | 39 | n/a | 0.000 | n/a |
| owasp-benchmark-java | 0 | 0 | 1415 | n/a | 0.000 | n/a |

### By pack

_Recall/F1 are n/a per pack: the scorer attributes false negatives at the corpus level only (labels aren't tagged with which rule should have caught them), so per-pack recall isn't derivable from the committed baselines without changing what they store._

| Pack | Rules | TP (all corpora) | FP (all corpora) | Precision |
|---|---|---|---|---|
| owasp | 30 | 1 | 0 | 1.000 |
| framework | 17 | 0 | 0 | n/a |
| slop | 13 | 0 | 0 | n/a |
| secrets | 6 | 0 | 0 | n/a |

<!-- SCORECARD:END -->
