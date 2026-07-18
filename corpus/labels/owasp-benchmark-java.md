# owasp-benchmark-java — adapter notes (W2-01)

Source: `expectedresults-1.2.csv` in the fetched corpus root
(`$CORPUS_DIR/owasp-benchmark-java`). Format per row:
`# test name, category, real vulnerability, cwe` e.g.
`BenchmarkTest00001,pathtraver,true,22`.

## Mapping

- Each `BenchmarkTest<N>` row maps to
  `testcode/BenchmarkTest<N>.java` (the scorer matches on the last two
  path segments, so the full `src/main/java/.../testcode/` prefix is
  not needed).
- `real == true` → `kind: "vuln"`; `real == false` → `kind: "safe"`
  (Benchmark's built-in true-negatives — the same test category
  implemented safely, which is what makes this corpus useful for a
  false-positive-rate signal, not just recall).
- `line` is omitted: Benchmark's expected-results file is file-level
  ("this test case is/isn't vulnerable"), not line-level, so the
  scorer's file+CWE match is what applies here (its line tolerance is
  moot when both sides omit line).
- `cwe` is the row's CWE column, digits only (`[cwe.replace(/\D/g, '')]`).

No fetch-time git-tracking workaround was needed here (unlike
`ossf-cve-benchmark`): `corpus/fetch.mjs`'s plain `git clone` of
BenchmarkJava already leaves every `testcode/*.java` file tracked by
the clone's own git index, so opengrep's default
git-tracked-files-only scan sees all 2,766 `.java` files without any
extra staging step.

## Counts

- 2,740 labeled test cases → 1,415 `vuln`, 1,325 `safe`. Matches the
  corpus's documented ~2,740 case count (`corpus.lock` notes "2741
  cases incl. true-negatives"; the 1-off is a stray/duplicate row in
  the CSV, not an adapter bug — 2,740 is what `expectedresults-1.2.csv`
  actually contains after the header/comment filter).

## Baseline result (2026-07-18) — HONEST ZERO, expected

`TP=0 FP=0 FN=1415` → `precision=n/a recall=0.000 F1=n/a`.

This is not a scorer or adapter bug. Confirmed directly:

```
opengrep scan --config packs $CORPUS_DIR/owasp-benchmark-java --sarif
→ Ran 10 rules on 5707 files: 0 findings.
```

Every `packs/*.yaml` opengrep rule in this repo declares
`languages: [typescript, javascript]` — there are **zero Java-targeted
opengrep rules**. Every `astgrep/*.yaml` rule targets `python`, `ruby`,
`typescript`, or `tsx` — **zero Java-targeted ast-grep rules** either.
Scanning a pure-Java corpus with a TS/JS/Py/Rb ruleset can only ever
produce `TP=0`; the 0.000 recall measures "we have no Java rules yet,"
not "our rules are bad at Java." Precision is `n/a` (undefined,
`tp+fp=0`) rather than misleadingly 0 or 1 — no rule fired at all, so
there is nothing to be precise or imprecise about.

This baseline exists to prove the pipeline (fetch → adapt → score →
baseline) works end-to-end on a real, large (2,740-case), GPL-licensed,
USE-only corpus — see `docs/CORPUS.md` for the coverage-gap framing.
The number will move only when Java-targeted rules land in a future
ticket (out of this ticket's `write_scope`).
