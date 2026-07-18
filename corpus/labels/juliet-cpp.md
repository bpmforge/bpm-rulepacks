# juliet-cpp — adapter notes (W2-04)

Source: `C/manifest.xml` in the fetched corpus root
(`$CORPUS_DIR/juliet-cpp/C/manifest.xml`). One flat `<container>` of
`<testcase>` blocks; each holds one or more `<file path="...">` children,
and a file carries a `<flaw line="N" name="CWE-NNN: ..."/>` child only if
it contains the deliberate defect, e.g.:

```xml
<testcase>
  <file path="CWE114_Process_Control__w32_char_connect_socket_01.c">
    <flaw line="121" name="CWE-114: Process Control"/>
  </file>
</testcase>
```

## Corpus fix required first

`corpus.lock`'s original `juliet-cpp` URL
(`.../2022-06-14-juliet-c-cplusplus-v1-3.zip`) 404s — that dated filename
no longer exists on `samate.nist.gov`. The live download link on
`https://samate.nist.gov/SARD/test-suites/112` is
`2017-10-01-juliet-test-suite-for-c-cplusplus-v1-3.zip` (HTTP 200 verified,
`content-length: 152957342`, ~146MB, 64,099 test cases per the page). URL
corrected in `corpus.lock`; sha256 pinned via
`PIN_SHA256=1 node corpus/fetch.mjs juliet-cpp` →
`ada9d7e1c323d283446df3f55bdee0d00bda1fed786785fe98764d58688f38eb`.

## Mapping

- Manifest `path` is a bare basename with no directory — the real file
  lives at `C/testcases/<CWE_DIR>/<basename>`, and for large CWE groups
  (e.g. `CWE124_Buffer_Underwrite`, `CWE36_Absolute_Path_Traversal`) it is
  further sharded into `C/testcases/<CWE_DIR>/sNN/<basename>`. The adapter
  walks `testcases/` once to build a basename → immediate-parent-dir index,
  so the emitted `label.file` is always `<immediate-parent-dir>/<basename>`
  — matching `score-corpus.mjs`'s `base()` (last 2 path segments), which
  would otherwise never match a real finding for sharded CWEs.
- `cwe` comes straight off the flaw's `CWE-NNN` prefix.
- **Only `kind: "vuln"` labels are emitted.** The manifest marks the single
  flaw line inside the "bad" path; it does not mark the `good()`/`good1()`/
  `good2()` safe-variant function bodies that sit in the same file (or the
  driver-only companion file with no `<flaw>` tag at all). Labeling those
  as `"safe"` would need Juliet's source-level `/* FLAW: */`/`/* FIX: */`
  comment-marker parsing to be correct — out of this ticket's bounded
  scope. Net effect: this corpus can only ever drive **recall**, never a
  precision/FP-rate signal (unlike `owasp-benchmark-java`, which has real
  file-level true-negatives).

## Bounded subset

Full C/C++ suite: 64,123 testcases / 65,263 flaw lines / 118 CWE folders.
`JULIET_PER_CWE_LIMIT` (default 25) caps flaw-labeled files **per CWE
folder**, taken in manifest order, so the subset has breadth across all
118 CWE categories instead of only the alphabetically-first few. Result:
**2,680 vuln labels, all 118 CWE folders represented, 0 skipped for a
missing file on disk** (62,583 flaws skipped for being past the per-CWE
cap — logged, not silent). Raise `JULIET_PER_CWE_LIMIT` and re-run to
widen; the adapter is deterministic and re-runnable.

## Baseline result (2026-07-18) — honest zero, expected

**TP=0, FP=0, FN=2680 → precision=n/a, recall=0.000, F1=n/a.**

This is verified traversal, not a silent-zero blind spot: juliet-cpp is the
fleet's first `type: zip` corpus (every prior corpus was a `git` clone),
and the extracted tree under `$CORPUS_DIR` is not a git repo — exactly the
landmine `ossf-cve-benchmark`'s adapter already documents (opengrep/semgrep
default to `git ls-files`-tracked files only and initially scanned 0 files
for that corpus). A direct `opengrep scan --config packs
$CORPUS_DIR/juliet-cpp --verbose` confirms opengrep detects the missing
git repo, logs "Running on all files instead," and reports **"Ran 10
rules on 106089 files: 0 findings"** — real traversal, zero findings
purely from the c/cpp language mismatch.

Every current opengrep rule (`packs/`) targets typescript/javascript and
every ast-grep rule (`astgrep/`) targets python/ruby/typescript/tsx — none
targets `c`/`cpp`. This baseline proves the zip-fetch → sha256-pin →
manifest.xml adapter → scorer path end-to-end on the largest, only
public-domain (CC0-1.0) corpus in the fleet; it does not, and isn't meant
to, exercise any rule's actual detection quality yet. Recall moves only
when a future ticket authors C/C++-targeted rules (out of this ticket's
`write_scope`, same division of labor as `owasp-benchmark-java`).

## To raise coverage

- `JULIET_PER_CWE_LIMIT=<n> node corpus/adapters/juliet.mjs juliet-cpp`
  then `npm run score -- juliet-cpp --update-baseline` to widen past the
  first 25 per CWE folder.
- Author C/C++-targeted opengrep/ast-grep rules (separate ticket) — only
  then will this baseline's TP/FP/FN move off the honest zero.
- Add Juliet's `/* FLAW: */`/`/* FIX: */` comment-marker parsing to recover
  `"safe"` labels for the good-variant functions (separate ticket) — would
  give this corpus a precision signal, not just recall.
- The adapter (`corpus/adapters/juliet.mjs`) takes a corpus-name argument
  and is written generically against the shared Juliet manifest.xml shape,
  so a future `juliet-java`/`juliet-csharp` entry in `corpus.lock` can
  reuse it as-is (point it at that corpus's own `manifest.xml`/`testcases/`
  layout — verify the directory names match before trusting the output).
