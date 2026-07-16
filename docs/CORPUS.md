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

## Retrieval benchmark (Lodestone side)

**CoIR** (Apache-2.0, ACL 2025) is the pick for code-search relevance — standardized qrels, MTEB/BEIR-compatible, covers CosQA/CodeSearchNet subsets. Lives with Lodestone's harness, not here. Avoid vendoring C-UDA data (CoSQA raw); consume it through CoIR.

_Sources verified via GitHub license API + LICENSE files + official pages, July 2026. Full citation list in the research thread._
