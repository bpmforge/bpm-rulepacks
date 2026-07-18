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

### owasp-benchmark-java re-baseline after Java rule authoring (W1-10, 2026-07-18)

Nine Java-targeted rules were authored to close the gap the W2-01 baseline
flagged, one per CWE anchor the ticket scoped: `astgrep/owasp/` gets four
structural (non-taint) rules — `a02-weak-hash-java` (CWE-327/328,
`MessageDigest.getInstance` constrained to a `"MD5"|"SHA1"|"SHA-1"` first
arg), `a02-weak-cipher-java` (CWE-327, `Cipher.getInstance` constrained to
a `"DES"|"DESede"` prefix), `a02-insecure-random-java` (CWE-330,
`new java.util.Random()`/`new Random()`), and `a07-cookie-insecure-flag-java`
(CWE-614, `$COOKIE.setSecure(false)`, mirroring the existing TS rule's
explicit-false-flag approach). `packs/owasp/` gets five opengrep
`mode: taint` rules — `a03-sql-injection-java` (CWE-89),
`a03-command-injection-java` (CWE-78, with a `pattern-propagators` entry so
taint flows through the `List.add()` calls the corpus's `ProcessBuilder`
idiom actually uses — a plain source→sink rule missed 100% of these),
`a03-path-traversal-java` (CWE-22), `a03-ldap-injection-java` (CWE-90), and
`a03-xpath-injection-java` (CWE-643) — all sourced from
`request.getParameter`/`getHeader`/`getQueryString`. All nine carry
`provenance: authored` (written from the CWE definitions and real Java
servlet/JDBC/JNDI/XPath idioms observed in the fetched corpus, not ported
from any external ruleset). 18 new fixtures (`.vuln.java`/`.ok.java` pairs)
were RED/GREEN-verified; `npm run check` is green at **146 passed, 0
failed, 0 skipped** (repo-wide, all packs).

One authoring lesson worth recording: two multi-argument taint sinks
(`DirContext.search(base, filter, filterArgs, ...)`,
`XPath.evaluate(expr, context)`) initially false-fired on `.ok` fixtures
that passed the *tainted* value through a non-sink argument position
(`filterArgs`, the parameterized-bind array) — opengrep's default taint
matching flags a sink pattern if *any* metavariable in a multi-arg pattern
carries taint, not just the one bound to the sink. Fixed with an explicit
`focus-metavariable: $SINK` on each multi-arg sink pattern. The
path-traversal `.ok` fixture needed a second iteration for a related
reason: taint over-approximates through method calls (a value derived from
a `Map.getOrDefault(taintedKey, ...)` lookup was still marked tainted even
though only the *key*, never the *value*, depended on request input) — the
fixture that stayed clean uses a literal-per-branch `if/else` allowlist
instead, since branch-literal assignment (not a call result) doesn't
propagate taint. Both are genuine opengrep taint-mode behaviors confirmed
by direct experiment, not guesses — noted here for the next taint rule
author in this repo.

Re-baseline (`npm run score -- owasp-benchmark-java --update-baseline`):

**Before: TP=0, FP=0, FN=1415 → precision=n/a, recall=0.000, F1=n/a.**
**After: TP=524, FP=62, FN=925 → precision=0.894, recall=0.362, F1=0.515.**

Per-rule breakdown (`corpus/baselines/owasp-benchmark-java.json`):
`a02-insecure-random-java` TP=193/FP=0, `a02-weak-hash-java` TP=113/FP=0,
`a02-weak-cipher-java` TP=97/FP=0, `a07-cookie-insecure-flag-java`
TP=36/FP=0, `a03-path-traversal-java` TP=41/FP=32,
`a03-sql-injection-java` TP=20/FP=15, `a03-ldap-injection-java` TP=6/FP=10,
`a03-xpath-injection-java` TP=7/FP=1, `a03-command-injection-java`
TP=11/FP=4. The four structural (non-taint) rules are FP-free — the
literal-API-misuse shape (weak digest/cipher/PRNG, explicit
`setSecure(false)`) has no ambiguity. All of the corpus's false positives
come from the five taint rules, expected: the corpus's "safe" variants for
sqli/pathtraver/ldapi/xpathi/cmdi are deliberately near-identical flows
that sanitize or parameterize just before the sink, and a source→sink taint
rule without corpus-specific sanitizer patterns will over-flag some of
those (the same class of limitation `a10-ssrf-user-controlled-url`'s
existing notes already call out for the TS rules).

**Overfitting guard:** every rule's pattern targets the general CWE shape
(a weak digest algorithm string, an unauthenticated PRNG constructor, an
explicit insecure-cookie flag, a request-sourced value reaching a
JDBC/process/filesystem/LDAP/XPath sink) — none reference OWASP Benchmark
test-file names, its `expectedresults-1.2.csv`, or any Benchmark-specific
helper class. Every source pattern (`getParameter`/`getHeader`/
`getQueryString`) and every sink (`Statement.execute*`, `Cipher.getInstance`,
`DirContext.search`, ...) is a real, general Java/servlet idiom independently
verifiable against the CWE definition and OWASP cheat sheets, not
reverse-engineered from the labels.

**Remaining gap (honest, not closed by this ticket):** recall is 0.362, not
higher, for real reasons — (1) several corpus CWE categories have no rule
at all yet (xss=455, trustbound=126 cases contribute 0 TP — out of this
ticket's scoped CWE list); (2) the corpus's dominant SQLi/cmdi/pathtraver/
ldapi/xpathi source variants also use `getParameterMap`/`getParameterValues`/
`getCookies()` (array/loop extraction) and multi-hop flows our source list
doesn't cover, so taint misses a majority of those categories' true
positives even though the sink/shape is right; (3) the crypto/hash rules
only match a literal algorithm-name argument, missing the corpus's
variable-indirection variants (`Cipher.getInstance(algorithm)` where
`algorithm` comes from a properties file) by design — chasing that would
need constant-propagation across statements, a different (and much
FP-riskier) rule shape. These are real follow-on tickets (broaden Java
taint sources; add `a03-xss-*-java` and `a01-*-java` trust-boundary rules;
decide whether variable-indirected crypto calls are worth the FP risk), not
gamed away here.

### Swift rule coverage, no pinned corpus yet (W1-11, 2026-07-18)

Both engines were verified against a live Swift file before authoring at
scale — this was not assumed. `ast-grep run --lang swift` and `opengrep scan`
(including `mode: taint`) both parse and match real Swift source directly
(confirmed with `Insecure.MD5.hash(...)`, a taint-mode SQLi sink, and other
probes) — contrary to the ticket's initial caution that ast-grep "may lack a
solid swift grammar," ast-grep 0.44.1 ships Swift as a built-in tree-sitter
language, no different from Java or Python. Both engines were therefore used,
matching the existing which-engine convention: structural/literal-API-misuse
checks in `astgrep/owasp/`, source→sink dataflow checks in `packs/owasp/`.

Ten rules, one per CWE anchor, covering the pattern-matchable OWASP/CWE
classes that map to real Swift/iOS idioms: `a02-weak-hash-swift` (CWE-327/
328, CryptoKit `Insecure.MD5`/`Insecure.SHA1` + CommonCrypto `CC_MD5`/
`CC_SHA1`), `a02-weak-cipher-swift` (CWE-327, CommonCrypto DES/3DES/ECB),
`a02-insecure-random-swift` (CWE-330, `arc4random`/`arc4random_uniform`/
`drand48` assigned into a security-named variable — unlike the unconstrained
Java `a02-insecure-random-java` rule, this one adds a `VAR` name regex,
because `arc4random` is legitimately used for non-security randomness (dice
rolls, shuffle, jitter) far more often than `java.util.Random` is; the regex
was deliberately narrowed to specific tokens — `token`/`password`/`secret`/
`otp`/`apikey`/`nonce`/`csrf`/`session*id`, not bare `key` or `code`, which
over-matched benign names like `monkey` or `barcode` in an earlier draft —
and the `.ok` fixture includes a same-API `arc4random_uniform` dice-roll
line to prove that boundary, not just a different-API example),
`a02-insecure-storage-swift` (CWE-312, `UserDefaults
.set(_:forKey:)` with a secret-shaped key), `a02-keychain-misconfig-swift`
(CWE-522, `kSecAttrAccessibleAlways[ThisDeviceOnly]`), `a03-sql-injection-
swift` (CWE-89, taint: `URLComponents.queryItems`/`UITextField.text` →
raw `sqlite3_exec` or FMDB `executeQuery(_:withArgumentsIn:)`),
`a03-command-injection-swift` (CWE-78, taint → `Process.arguments`),
`a03-path-traversal-swift` (CWE-22, taint → `FileManager.contents(atPath:)`),
`a03-webview-xss-swift` (CWE-79, taint → `WKWebView.loadHTMLString(_:
baseURL:)`), and `a05-insecure-transport-swift` (CWE-319, `language: generic`
+ `pattern-regex` over `Info.plist` text matching `NSAllowsArbitraryLoads`
set `true` — the same generic/text-file approach the `secrets` pack already
uses, since ast-grep has no plist grammar and opengrep's own AST rules only
apply to source, not property-list XML).

One authoring lesson: opengrep's taint mode flags a multi-metavariable sink
pattern if *any* captured metavariable is tainted, not just the one that is
actually the sink argument — the same landmine `owasp-benchmark-java`'s
notes above describe for LDAP/XPath sinks. It bit the Swift SQLi rule
first-try: `$DB.executeQuery($SINK, withArgumentsIn: $ARGS)` fired on the
*parameterized* (`.ok`) fixture too, because `$ARGS` (`[name]`) carried taint
even though `$SINK` (the literal `"... = ?"` query string) did not. Fixed
with the nested `patterns: [{pattern: ...}, {focus-metavariable: $SINK}]`
form, matching `a03-ldap-injection-java`'s existing pattern in this repo —
restated here because it is the second time this exact shape has bitten a
new rule, and the third rule author to hit it should not have to
rediscover it from a taint-mode false positive.

**No pinned Swift corpus exists yet** (`corpus/corpus.lock` has none of
NIST Juliet, OWASP Benchmark, OpenSSF, etc. in Swift/Obj-C) — this ticket's
`write_scope` was rules + fixtures only, so these ten rules are validated
by their own RED/GREEN fixture pairs (`npm run check`, all passing) and not
yet scored against a labeled real-world corpus. A Swift/iOS corpus baseline
(candidates: OWASP iGoat, an adapter over a curated CVE set, or a
hand-labeled smoke corpus in the DSVW/juice-shop spirit) is a genuine
follow-on ticket, not gamed around here — until it lands, this pack's
precision/recall against real code is unmeasured, only its fixture
correctness is proven.

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

### Kotlin rule authoring — no pinned corpus yet (W1-12, 2026-07-18)

Eleven Kotlin-targeted rules were authored to extend the OWASP pack past
Java/TS into Android/Kotlin idioms: engine choice was verified live before
authoring at scale (both `ast-grep 0.44.1` and `opengrep 1.25.0` parse
`.kt` correctly, including opengrep taint mode — `MessageDigest.getInstance`
and a `getStringExtra`→`File()` taint flow both confirmed on hand-written
`.kt` snippets before any rule was written). `astgrep/owasp/` gets nine
structural rules — `a02-weak-hash-kotlin` (CWE-327/328), `a02-weak-cipher-
kotlin` (CWE-327, `Cipher.getInstance` constrained to a DES/DESede name
**or** an `/ECB(/|")` mode suffix on any cipher — the ECB branch closes a
gap the equivalent `a02-weak-cipher-java` rule (W1-10) doesn't cover:
`AES/ECB/...` is a strong cipher in a broken mode, still CWE-327, and the
ticket brief named "Cipher DES/ECB" explicitly), `a02-insecure-random-kotlin` (CWE-330),
`a02-insecure-transport-kotlin` (CWE-295, empty-bodied
`X509TrustManager.checkServerTrusted`/`checkClientTrusted` overrides or an
always-true `HostnameVerifier` lambda), `a02-sharedprefs-secret-storage-
kotlin` (CWE-312, `edit().putString()` with a password/token/secret-shaped
key), `a03-sql-injection-android-kotlin` (CWE-89, `rawQuery`/`execSQL`/
JDBC `Statement`/`createNativeQuery` built via `+` concatenation or a
`${...}` string-template interpolation instead of bind parameters),
`a03-command-injection-kotlin` (CWE-78, non-literal argument to
`Runtime.exec()`/`ProcessBuilder(...).start()`), `a03-webview-untrusted-
content-kotlin` (CWE-79, non-literal HTML into `WebView.loadData`/
`loadDataWithBaseURL`), and `a05-webview-js-interface-kotlin` (CWE-749,
`addJavascriptInterface` — flagged unconditionally, since exposing a
native JS bridge is a native attack-surface decision regardless of
argument shape). `packs/owasp/` gets one opengrep `mode: taint` rule —
`a03-path-traversal-kotlin` (CWE-22, `Intent.getStringExtra`/servlet
`getParameter`/`getHeader` sources into `File`/`FileInputStream`/
`FileOutputStream`/`FileReader`/`FileWriter` sinks). One rule reaches
outside strict Android/OWASP-Top-10-mapping into a documented recent
mobile CVE class: `a01-pendingintent-mutable-kotlin` (CWE-926,
`PendingIntent.getActivity`/`getService`/`getBroadcast` missing
`FLAG_IMMUTABLE` — "PendingIntent hijacking," this ticket's answer to
"Android exported components / intent misuse if pattern-expressible" from
the ticket brief). All eleven carry `provenance: authored` (written from
the CWE definitions and real Android/JDBC/Spring-Kotlin idioms, not ported
from any external ruleset). 22 new fixtures (`.vuln.kt`/`.ok.kt` pairs)
were RED/GREEN-verified; `npm run check` is green at **168 passed, 0
failed, 0 skipped** (repo-wide, all packs) and `score-selftest` still
holds precision=recall=1.000.

Two authoring lessons worth recording, both caught by the RED-before-GREEN
discipline rather than shipped:

1. **Kotlin string templates defeat naive literal-exclusion patterns.**
   `a03-command-injection-kotlin`'s `not: pattern: exec("$LITERAL")`
   exclusion is meant to skip calls whose argument is a hardcoded string,
   but ast-grep binds `$LITERAL` to the *whole* string-literal node
   regardless of whether it contains a `${...}` interpolation — so a vuln
   fixture written as `exec("ping -c 1 $host")` (a template string) was
   silently excluded by the same pattern meant to exempt only truly
   constant strings, producing a false-negative RED test. Fixed by writing
   the vuln fixture as explicit `+` concatenation (`"ping -c 1 " + host`)
   instead, which is a structurally different node the exclusion pattern
   correctly does not match. Anyone authoring a "non-literal argument"
   exclusion rule for a template-string language (Kotlin, JS, Python
   f-strings) should fixture-test with concatenation *and* interpolation
   separately — they are not interchangeable "non-literal" shapes for a
   literal-exclusion pattern.
2. **The Java taint over-approximation lesson (W1-10) reproduces
   identically in Kotlin.** `a03-path-traversal-kotlin`'s first `.ok`
   fixture attempt used `File(name).name` to strip path components from a
   tainted value before reuse — opengrep's taint engine still marked the
   result tainted (a method call on tainted input doesn't clear taint by
   default), so the fixture wasn't actually clean. Same fix as the Java
   rule: the `.ok` fixture uses a literal-per-branch `when` allowlist
   instead, since branch-literal assignment (not a call result) doesn't
   propagate taint.

**Follow-on flagged, not done here:** this ticket's `write_scope` is rules
+ fixtures only, matching the ticket brief ("No pinned Kotlin corpus —
validate via fixtures; note follow-on"). There is currently no
`kotlin`/`android`-language corpus in `corpus.lock` — candidates for a
future ticket: **OWASP MASTG's crackmes/UnCrackable apps** (MIT-licensed
Android CTF-style targets with documented vulns, small enough to hand-
label) or a **Juliet-for-Android equivalent** if one is ever published;
absent that, an adapter over a curated set of real Android CVE fix-commits
(same shape as `CWE-Bench-Java`) would give a precision/recall signal.
Until then these eleven rules are Tier-1 (fixture) proven only, with no
Tier-2 (corpus) precision/recall number — the same honest gap the
`owasp-benchmark-java` W2-01 baseline called out for Java before W1-10
closed it.

Concept-ontology note: `a02-insecure-transport-kotlin` and
`a02-sharedprefs-secret-storage-kotlin` use the existing `cryptography`/
`secrets_config` keys respectively (both have a CWE overlap with their
rule's own CWE, `secrets_config` exactly so — CWE-312 is in its seed
list). `a05-webview-js-interface-kotlin` and
`a01-pendingintent-mutable-kotlin` both use the existing `authorization`
key as an approximate fit — neither CWE-749 nor CWE-926 is a textbook
"authorization" CWE, but both vulnerabilities are fundamentally a missing
trust/access boundary (an unauthenticated JS bridge; a hijackable
cross-app Intent) closer to `authorization`'s "broken access control"
shape than to any other existing key. Flagging here per the same
"metadata label choice, not an ontology-file edit" convention this repo's
`docs/AUTHORING.md` established for `code_quality` and
`dependency_supply_chain`.

### C# / .NET rule authoring — no pinned corpus yet (W1-14, 2026-07-18)

Engine choice was verified live before authoring at scale, per this file's
established convention: `ast-grep 0.44.1` parses `.cs` under the language id
`cs` (not `csharp` — `ast-grep --lang csharp` errors "not supported"; `cs` is
the correct tree-sitter grammar id) and `opengrep 1.25.0` parses `.cs` under
`languages: [csharp]`, including `mode: taint` (confirmed live with a
`Request.QueryString[...]` → `Process.Start(...)` taint flow before any rule
was written). Ten rules were authored, one per CWE anchor covering the
ticket's named .NET idioms: `astgrep/owasp/` gets seven structural rules —
`a02-weak-hash-csharp` (CWE-327/328, `MD5.Create()`/`SHA1.Create()`/
`MD5CryptoServiceProvider`/`SHA1CryptoServiceProvider`), `a02-weak-cipher-
csharp` (CWE-327, `DESCryptoServiceProvider`/`TripleDESCryptoServiceProvider`
or an explicit `Mode = CipherMode.ECB`), `a02-insecure-random-csharp`
(CWE-330, `new Random().Next(...).ToString()` assigned into a
security-named variable — same VAR-regex-constrained approach as
`a02-insecure-random-swift`, since `System.Random` is legitimately used for
non-security randomness far more often than not), `a03-sql-injection-csharp`
(CWE-89, `SqlCommand`'s query text built via string concatenation or
interpolation, at either the constructor or a later `CommandText`
assignment), `a05-xxe-csharp` (CWE-611, explicit `DtdProcessing.Parse` or
`XmlResolver = new XmlUrlResolver()`), `a08-insecure-deserialization-csharp`
(CWE-502, `BinaryFormatter`/`LosFormatter`/`JavaScriptSerializer` +
`SimpleTypeResolver` instantiation), and `a02-weak-tls-csharp` (CWE-295, a
`ServerCertificateCustomValidationCallback`/`ServerCertificateValidationCallback`
hardcoded to unconditionally return `true`). `packs/owasp/` gets three
opengrep `mode: taint` rules — `a03-command-injection-csharp` (CWE-78,
`Request.QueryString`/`Form`/`Params` → `Process.Start`),
`a03-path-traversal-csharp` (CWE-22, same sources →
`File.ReadAllText`/`OpenRead`/`Open`/`FileStream`), and `a03-xss-csharp`
(CWE-79, same sources → `Response.Write`/`Html.Raw`). All ten carry
`provenance: authored` (written from the CWE definitions and real
ADO.NET/System.Security.Cryptography/System.Xml/System.Web idioms, not
ported from any external ruleset). 20 new fixtures (`.vuln.cs`/`.ok.cs`
pairs) were RED/GREEN-verified; `npm run check` is green at **208 passed, 0
failed, 0 skipped** (repo-wide, all packs) and `score-selftest` still holds
precision=recall=1.000.

Three authoring lessons worth recording:

1. **`kind`/`pattern` metavariable constraints are not directly
   composable in ast-grep's `constraints:` block** — `constraints: {ARG:
   {kind: binary_expression}}` silently matched nothing (no error, just
   zero findings), and `has:` nested inside the same `pattern:` map as a
   sibling key hard-errors ("Rule must specify a set of AST kinds to
   match"). The working shape, used throughout `a03-sql-injection-csharp`,
   is `all: [{pattern: ...}, {has: {kind: ..., stopBy: end}}]` — a
   top-level `all` combinator with the structural match and the
   descendant-kind check as separate sibling rules, not a constraint on
   the captured metavariable itself. This is the same "kind constraint"
   landmine for the next author who wants to discriminate an argument's
   *shape* (literal vs. concatenation vs. interpolation) rather than its
   text.
2. **A bare assignment-expression pattern (`$X.Prop = $VAL`) does not
   parse as a standalone ast-grep rule** — `pattern: $CMD.CommandText =
   $ARG` errors the same "must specify AST kinds" message the `kind`
   constraint issue above does, because top-level `=` is ambiguous between
   several C# node kinds. The fix, already used elsewhere in this repo for
   the `a07-cookie-insecure-flag` TS rule, is the `pattern: {context: '...
   ;', selector: assignment_expression}` form (a full, syntactically valid
   statement as context, with an explicit `selector` disambiguating which
   node kind the pattern binds to) — used for every assignment-shaped C#
   rule here (`a05-xxe-csharp`'s two patterns, `a02-weak-cipher-csharp`'s
   ECB-mode pattern, `a02-weak-tls-csharp`'s callback patterns).
3. **opengrep's C# grammar rejects an ellipsis-metavariable
   (`$$$REST`) in some multi-argument sink patterns.** `File.Open($SINK,
   $$$REST)` fails with "Invalid pattern for C#: Stdlib.Parsing.Parse_error"
   even though the structurally similar `new SqlCommand($ARG, $$$REST)`
   parses fine under ast-grep — this is an opengrep-specific C# parser gap,
   not a general ellipsis problem. `a03-path-traversal-csharp` works around
   it with a fixed single metavariable per argument position
   (`File.Open($SINK, $MODE)`) instead of `$$$REST`, which also fully
   worked for `new FileStream($SINK, $MODE)`. The Java/Kotlin
   taint-over-approximation lesson (a method-call result on tainted input
   stays tainted; only a literal-per-branch allowlist actually clears
   taint) reproduces identically in C# — `a03-path-traversal-csharp`,
   `a03-command-injection-csharp`, and `a03-xss-csharp`'s `.ok` fixtures
   all use an `if/else` literal allowlist rather than a sanitizer-call
   attempt, which failed on the first try for the same reason documented
   for Java/Kotlin above.

**No pinned C# corpus exists yet** even though NIST Juliet/SARD 1.3 (the
"Standardized set" table above) lists C# as one of its four languages —
`corpus.lock` currently only has a `juliet-cpp` entry (W2-04), no
`juliet-csharp` entry, so this ticket's `write_scope` (rules + fixtures
only) is validated by RED/GREEN fixture pairs alone, not a corpus baseline.
Wiring a `juliet-csharp` corpus entry (same zip, different manifest
subfolder) and re-running `corpus/adapters/juliet.mjs` against it is a
genuine, low-effort follow-on ticket — the adapter and fetch machinery
already exist and are corpus-agnostic within Juliet's own zip.

Concept-ontology note: `a05-xxe-csharp` and `a03-xss-csharp` use the
existing `input_validation` key (CWE-79 is in its seed list; CWE-611 has no
closer existing key — XML/entity parsing isn't represented by any current
concept, so `input_validation`'s "untrusted input reaching a parser/sink
without validation" framing is the nearest approximate fit, same
"metadata label choice, not an ontology-file edit" convention as
`code_quality`/`dependency_supply_chain` above). All other seven rules map
to an exact existing key: `cryptography` (weak-hash, weak-cipher,
insecure-random, weak-tls — CWE-295 is not in `cryptography`'s seed CWE
list, but its `terms` include `tls`/`x509`/`certificate` directly, an exact
term-level fit even without an exact CWE-list entry), `sql_database`
(sql-injection), `deserialization` (insecure-deserialization), and
`command_execution` (command-injection).
### Go rule coverage, no pinned corpus yet (W1-13, 2026-07-18)

Both engines were probed live before authoring at scale. ast-grep 0.44.1
ships a Go grammar, but it has a real grammar-ambiguity bug for this
language: `tree-sitter-go` parses any `pkg.ExportedName(args)` call —
i.e. essentially every standard-library call, since Go's exported-identifier
convention capitalizes the first letter — as a `type_conversion_expression`
instead of a `call_expression`, both in isolation (how ast-grep parses a
`--rule` pattern) and in full-file context. Confirmed against `fmt.Println`,
`md5.Sum`, and `db.Query` in both the 1-arg and 2-arg case; the 2-arg case
produced outright `ERROR` nodes in the parse tree. `ast-grep run -l go -p
'package $X'` matches fine (lowercase/unqualified shapes are unaffected —
so are unexported `lowerCase(args)` calls), but every idiom this ticket
needs (`db.Query`, `exec.Command`, `os.ReadFile`, `filepath.Join`,
`http.Get`, `md5.Sum`, `rand.Intn`, `template.Execute`) is a capitalized
qualified call and hits the bug. All nine rules therefore live in
`packs/owasp/` (opengrep only) — opengrep parses and matches every one of
these shapes cleanly, including `mode: taint` with a `fmt.Sprintf`
propagator and native taint-through-`+`-concatenation (verified live, no
propagator needed for the concat case).

Nine rules, one per CWE anchor: `a03-sql-injection-go` (CWE-89, taint:
`r.URL.Query().Get`/`FormValue`/`PostFormValue` → `db.Query`/`Exec`(
`Context`)/`QueryRow`(`Context`), through an `fmt.Sprintf` propagator or
direct `+` concatenation), `a03-command-injection-go` (CWE-78, taint →
`exec.Command`/`CommandContext` — Go's `exec` package never invokes a
shell, so the risk framed in the rule message is argument/flag injection,
not shell metacharacter injection), `a03-path-traversal-go` (CWE-22, taint →
`os.Open`/`OpenFile`/`ReadFile`/`Create`/`filepath.Join`),
`a02-weak-hash-go` (CWE-327/328, structural: `md5.New`/`Sum`,
`sha1.New`/`Sum`), `a02-weak-cipher-go` (CWE-327, structural:
`des.NewCipher`/`NewTripleDESCipher`, plus a `$PKG.NewECBEncrypter`/
`NewECBDecrypter` metavariable-receiver match for ECB mode — Go's stdlib
`crypto/cipher` deliberately ships no ECB constructor, so this shape only
appears via a third-party helper like `github.com/aead/ecb`; verified live
against that exact call shape), `a02-insecure-random-go` (CWE-330,
structural: `rand.Intn`/`Int31`(`n`)/`Int63`(`n`)/`Float64` — `math/rand`
and `crypto/rand` export disjoint function names, `crypto/rand.Read`/`Int`
vs `math/rand.Intn`, so no explicit import-source disambiguation was
needed, confirmed by testing the `.ok` fixture's `crypto/rand.Read` call
against the rule directly), `a02-tls-verify-disabled-go` (CWE-295,
structural: `tls.Config{..., InsecureSkipVerify: true, ...}`),
`a03-template-injection-go` (CWE-79, structural: `$TPL.Execute($W, ...)`
gated on a `pattern-inside` match against a grouped `import (...
"text/template" ...)` block — `text/template` performs no HTML escaping,
unlike `html/template`, which shares the same `New`/`Parse`/`Execute` API
so the `.ok` fixture is a one-import-line diff), `a10-ssrf-go` (CWE-918,
taint → `http.Get`/`Head`/`Post`/`NewRequest`(`WithContext`)). All 18
fixtures RED/GREEN-verified; `npm run check`: 206 passed, 0 failed, 0
skipped.

No `go`-language corpus is pinned in `corpus.lock` yet — candidates for a
future ticket: **OWASP Benchmark** has no official Go port, but **OSS-Fuzz's
Go-language findings** or a curated set of real Go CVE fix-commits (same
shape as `CWE-Bench-Java`) would give a labeled precision/recall signal;
**Gitleaks' own Go source** (MIT) is too clean to serve as a vuln corpus.
Until then these nine rules are Tier-1 (fixture) proven only, with no
Tier-2 (corpus) precision/recall number — the same honest gap called out
for Swift (W1-11) and Kotlin (W1-12) before a Go-specific baseline exists.

Concept-ontology note: all nine rules reuse existing keys — `sql_database`,
`command_execution`, `file_upload_path`, `cryptography` (hash/cipher/random/
TLS), `input_validation` (template injection, matching
`a03-xss-dangerously-set-innerhtml`'s existing choice for the same CWE-79
XSS-shaped output-escaping gap), and `ssrf_outbound`. No new ontology key
needed for this batch.

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

## PHP rule coverage (W1-15, 2026-07-18)

Ten PHP-targeted rules were authored — `packs/owasp/` gets seven opengrep
`mode: taint` rules (sources `$_GET`/`$_POST`/`$_REQUEST`/`$_COOKIE`) —
`a03-sql-injection-php` (CWE-89, `mysqli_query`/`mysql_query`/`PDO::query`/
`PDO::exec`), `a03-command-injection-php` (CWE-78, `exec`/`system`/
`shell_exec`/`passthru`/`popen`/`proc_open` and the backtick shell-exec
operator), `a03-path-traversal-php` (CWE-22, `fopen`/`file_get_contents`/
`readfile`), `a03-file-inclusion-php` (CWE-98, PHP-specific LFI/RFI via
`include`/`include_once`/`require`/`require_once` — split out from path
traversal as its own CWE anchor since PHP is one of the few languages where
"path reaches a read sink" and "path reaches an execute sink" are both live
risks), `a03-xss-php` (CWE-79, `echo`/`print` without `htmlspecialchars`/
`htmlentities`), `a03-code-injection-php` (CWE-94, `eval`/`assert`/
`create_function`), and `a08-insecure-deserialization-php` (CWE-502,
`unserialize()` — PHP Object Injection). `astgrep/owasp/` gets three
structural rules — `a02-weak-hash-php` (CWE-327/328, `md5()`/`sha1()`
constrained to a password-shaped argument name, mirroring the
constraint-based approach used elsewhere in this pack rather than flagging
every hash call), `a02-weak-cipher-php` (CWE-327, `mcrypt_encrypt()` with
`MCRYPT_DES` — the extension itself was removed in PHP 7.2 but the idiom
persists in legacy code scanners still need to catch), and
`a02-insecure-random-php` (CWE-330, bare `rand()`/`mt_rand()` vs
`random_bytes()`/`random_int()`).

No PHP corpus is pinned in `corpus.lock` yet (see "Standardized set" above —
NIST Juliet/SARD 1.3 covers PHP but hasn't been onboarded via an
adapter/labels/baseline pass). All ten rules are fixture-verified only
(RED/GREEN pairs in `fixtures/owasp/`, `npm run check` green, 0 skips) —
they carry no corpus-derived precision/recall numbers until a future ticket
adds a PHP corpus the way `owasp-benchmark-java` was onboarded for Java.
`preg_replace()`'s deprecated `/e` modifier (removed entirely in PHP 7.0)
was considered for CWE-94 coverage and deferred: it targets dead PHP <7.0
syntax, not a shape any currently-supported PHP codebase can contain, so a
rule for it would have no reachable vulnerable target to score against.

## C/C++ rule coverage + Juliet re-baseline (W1-16, 2026-07-18)

Both engines were verified live on tiny C and C++ fixtures before authoring
at scale, per this file's established convention: `ast-grep 0.44.1` parses
both `-l c` and `-l cpp` cleanly (confirmed with a `strcpy($DST, $SRC)`
probe against hand-written `.c` and `.cpp` files) and `opengrep 1.25.0`
parses and taint-matches both languages too (confirmed with a
`getenv()`→`system()` taint flow in `.c` and `.cpp`). One real constraint
shaped every rule here: **ast-grep's rule schema requires a single scalar
`language:` field — it has no multi-language list form** (`language: [c,
cpp]` and `languages: [c, cpp]` both hard-error "data did not match any
variant of untagged enum SgLang" / "missing field `language`", confirmed
live). Opengrep's `languages:` key *does* accept a list (already used
elsewhere in this repo, e.g. `a03-path-traversal.yaml`'s `[typescript,
javascript]`). Since the ticket brief calls for **one rule per CWE
anchor** covering both C and C++ in a single file (not a separate
per-language rule the way Java/Kotlin/Swift/C#/Go/PHP each got their own
suffix), all seven rules here are **opengrep**, `languages: [c, cpp]`,
living in `packs/owasp/` — including the four that are purely structural
(no taint) and would otherwise have been ast-grep by this file's own
"which engine" guidance; the multi-language requirement overrides that
default here.

Seven rules, one per CWE anchor, covering the pattern-matchable
memory-safety and injection classes the ticket scoped (deep interprocedural
bugs — use-after-free, double-free — are explicitly deferred to the Joern
deep-taint tier, not force-fit into a structural/taint rule that can't
prove object lifetime):

- `mem-unsafe-string-functions` (CWE-120/787/242): `strcpy`/`strcat`/
  `sprintf`/`gets` unconditionally, plus `scanf` narrowed via
  `metavariable-regex: ^"%s"$` to the bare unbounded-width case (a
  `scanf("%15s", ...)` call with an explicit width stays clean). No
  taint needed — the mere presence of the call is the anti-pattern, same
  shape as `a02-weak-hash-go`'s unconstrained `md5.New()`.
- `a03-format-string-c` (CWE-134, taint): `getenv()`/`argv[$I]` →
  `printf`/`fprintf`/`syslog` called with the tainted value as the format
  argument itself (not a `%s` data argument).
- `a03-command-injection-c` (CWE-78, taint): same sources →
  `system`/`popen`/`execl`/`execlp`/`execvp`/`execve`.
- `a02-weak-crypto-c` (CWE-327/328): legacy `MD5_Init`/`SHA1_Init`, the
  `EVP_md5()`/`EVP_sha1()`/`EVP_des_cbc()`/`EVP_des_ecb()`/
  `EVP_aes_*_ecb()` constant constructors, and `EVP_get_digestbyname()`/
  `EVP_get_cipherbyname()` narrowed via `metavariable-regex` to an
  md5/sha1/des/rc4-shaped algorithm-name literal.
- `a02-insecure-random-c` (CWE-330): `$VAR = rand();` gated by a
  `metavariable-regex` VAR-name constraint (token/password/secret/otp/
  session*id/apikey/nonce/csrf) — same discriminator approach as
  `a02-insecure-random-swift`/`-csharp`, since C's `rand()` is
  legitimately used for non-security randomness far more often than not.
- `mem-integer-overflow-malloc` (CWE-190): `malloc($A * $B)` /
  `realloc($P, $A * $B)` — an inline size-multiplication with no
  overflow check. **Precision caveat, disclosed rather than hidden:**
  the Juliet re-baseline below shows this rule firing 25,021 times
  against a single corpus with zero confirmed true positives at that
  bound — it matches the extremely common, usually-safe
  `malloc(sizeof(T) * n)` idiom just as readily as a genuinely
  attacker-influenced multiplication, since a single-file structural
  pattern cannot tell "n is a small const-bounded loop counter" from
  "n comes off the network." `confidence: medium` (not `high`) already
  reflects this; treat this rule as a lead worth triaging, not a
  ground-truth positive, until a human or the Tier-2 triage step
  confirms operand provenance. No OWASP Top 10 category fits a
  memory-safety CWE
  (OWASP's Top 10 is web-application-shaped, not a C/C++ weakness
  taxonomy), so this rule and `mem-unsafe-string-functions` both omit the
  optional `owasp:` metadata field rather than force an inaccurate
  mapping — an honest gap, matching this file's "flag for whoever expands
  the ontology" convention for `concept:` labels that don't have an exact
  seed-file fit either (both use `concept: memory_safety`, a new key not
  yet in `concept-ontology-seed.yaml`, same status as `code_quality`/
  `dependency_supply_chain` introduced by earlier tickets).
- `a03-path-traversal-c` (CWE-22, taint): same sources → `fopen`/`open`.

All seven carry `provenance: authored` (written from the CWE definitions
and real libc/OpenSSL/POSIX idioms, not ported from any external
ruleset). 28 new fixtures (`.vuln.c`/`.ok.c` **and** `.vuln.cpp`/`.ok.cpp`
pairs — two full RED/GREEN pairs per rule, one per language, since a
single opengrep rule covers both and each language needed its own live
proof) were RED/GREEN-verified; `npm run check` is green at **274 passed,
0 failed, 0 skipped** (repo-wide, all packs) and `score-selftest` still
holds precision=recall=1.000.

Two authoring lessons worth recording:

1. **Opengrep's `metavariable-regex` is start-anchored, not a substring
   search — the opposite of ast-grep's `constraints:` regex.** The
   insecure-random rule's first draft used the bare regex
   `(?i)(token|password|secret|...)` (copied from the working ast-grep
   `a02-insecure-random-csharp` rule's `constraints:` block) and silently
   failed RED on a variable named `session_token`: the assignment
   `session_token = rand();` produced 0 findings even though `token` is
   plainly a substring. Root cause, confirmed by direct experiment: a
   variable named exactly `token` matched (the term is at position 0),
   but `session_token` did not, because opengrep's `metavariable-regex`
   behaves like Python's `re.match` — anchored at the start of the
   captured text — while ast-grep's `constraints:` regex (Rust regex
   `is_match`) searches anywhere in the string. The fix is
   `regex: '.*(?i)(token|...).*'` — an explicit leading/trailing `.*` to
   force a substring search. This is a real, easy-to-miss cross-engine
   behavior difference, not a typo, and is worth restating for the next
   author who reuses a VAR-name-constraint regex across the two engines:
   **the same regex text does not mean the same match semantics in
   opengrep vs. ast-grep.**
2. **Juliet's own C/C++ test-generator idiom defeats a naive
   real-function-name rule on a large share of its own corpus — expected,
   and not chased.** Investigating why `a03-command-injection-c` scored
   zero true positives against Juliet's `CWE78_OS_Command_Injection`
   folder (7,813 files) surfaced two compounding reasons, both confirmed
   by direct experiment against a real Juliet source file: (a) Juliet's
   generated templates wrap every source/sink in an
   all-caps preprocessor macro (`#define GETENV getenv`, `#define SYSTEM
   system`) for its own Windows/POSIX portability — a structural rule
   matching literal `system($SINK)` never matches source text that reads
   `SYSTEM(data)`, since opengrep parses pre-preprocessor text and does
   not expand macros; and (b) even after retargeting a probe rule at the
   macro names directly, taint still didn't propagate, because Juliet's
   most common flow variant builds the tainted buffer via `strncat(data +
   dataLen, environment, ...)` — the destination argument is a pointer
   *expression* (`data + dataLen`), not the bare `data` lvalue, and
   opengrep's taint engine does not infer that writing through a
   pointer-offset expression taints the base variable, with or without an
   explicit `pattern-propagators` entry for `strncat`. Neither of these
   is a real-world C idiom worth chasing: the macro wrapping is a Juliet
   test-harness artifact (real code calls `system()`, not a
   project-specific `SYSTEM()` macro aliasing it), and matching the exact
   `$DST + $OFFSET` pointer-arithmetic shape would be over-fitting to one
   corpus's code-generation template rather than the general "tainted
   value flows into a command/format/path sink" shape the ticket asked
   for — the CORPUS.md overfitting guard other tickets already established
   applies here too. Documented rather than gamed, per that same
   discipline.

### juliet-cpp re-baseline after C/C++ rule authoring (W1-16, 2026-07-18)

`npm run score -- juliet-cpp --update-baseline` re-ran the (now C/C++-aware)
opengrep rule set over the same pinned corpus the W2-04 baseline established.

**Before (W2-04): TP=0, FP=0, FN=2680 → precision=n/a, recall=0.000, F1=n/a.**
**After (W1-16): TP=18, FP=0, FN=2662 → precision=1.000, recall=0.007, F1=0.013.**

Recall moved off zero, as the ticket required, and precision is clean
(zero false positives across the whole corpus). Per-rule breakdown
(`corpus/baselines/juliet-cpp.json`): all 18 true positives came from
`mem-unsafe-string-functions` (`gets()`/`strcpy()`/`sprintf()`/bare-`%s`
`scanf()` calls Juliet's CWE242/CWE121/CWE122-family test cases do write
as literal, unwrapped libc calls, unlike the macro-wrapped CWE78 case
above), against 18,653 further matches on lines the labels file doesn't
tag at all (`unlabeled`, tracked but not scored either way — Juliet's
generic helper scaffolding (`std_testcase.h`, its own `printLine`/example
buffers) reuses these same libc calls throughout the tree outside any
labeled flaw line). `mem-integer-overflow-malloc` fired 25,021 times
across the corpus (this shape — `malloc(a*b)`/`realloc(p,a*b)` — is
common Juliet allocation boilerplate well beyond just the CWE190 folder)
but landed 0 true positives: the CWE190 label line and the actual
`malloc($A*$B)` call site did not align within the ±2-line matching
tolerance in the sampled files, plausible given Juliet's per-CWE
flow-variant templates route the multiplication through intermediate
variables in several variants — the same "source list doesn't cover every
flow variant" limitation the `owasp-benchmark-java` notes above already
describe. The other five rules
(`a02-weak-crypto-c`, `a02-insecure-random-c`, `a03-format-string-c`,
`a03-command-injection-c`, `a03-path-traversal-c`) scored zero matches
against this corpus, for three *different* verified reasons, not one
blanket cause:

- **CWE-330 (insecure random) and CWE-22 (path traversal) don't exist as
  Juliet C/C++ CWE numbers at all** — Juliet uses CWE338 (Weak PRNG) and
  CWE23/CWE36 (Relative/Absolute Path Traversal) instead, so the label
  set has zero entries tagged 330 or 22 to score against regardless of
  rule quality (confirmed by inspecting the labels file directly:
  `{"134":25,"190":25,"242":18,"327":25,"328":25}` — no 78/22/330/120/787
  keys at all in the 25-per-CWE-folder bounded sample).
- **CWE-78 (command injection)** has a real, labeled folder (7,813
  files) but its sampled entries happen to be the macro-wrapped,
  pointer-offset flow variant already described above.
- **CWE-134 (format string) and CWE-327/328 (weak hash/cipher) also have
  real labeled folders, and neither is a macro-naming or missing-CWE
  issue — each is a genuine sink/API mismatch**, confirmed by reading a
  sampled file from each folder directly rather than assumed: Juliet's
  C/C++ CWE134 samples route the tainted value through the *variadic*
  sink family (`vfprintf`/`vfwprintf`/`vsnprintf`), not the fixed-arity
  `printf`/`fprintf`/`syslog` this rule's `pattern-sinks` list covers,
  and several flow variants pass the value across a C++ reference
  between two separate source files — beyond opengrep's intrafile taint
  scope even if the sink matched. Juliet's C/C++ CWE327/CWE328 samples
  use the **Windows CryptoAPI** (`CryptAcquireContext`/`CryptCreateHash`/
  `CryptDeriveKey` with `CALG_MD5`/`CALG_DES`/`CALG_RC5`), not the
  OpenSSL EVP/legacy-MD5 API this rule targets — a different crypto
  library entirely, not a narrower pattern within the same one. Widening
  `a03-format-string-c` to the `v*printf` family and `a02-weak-crypto-c`
  to CryptoAPI's `CALG_*` constants would close these two specific gaps
  without overfitting (both are real, general C/Windows idioms, not
  Juliet-specific naming) — flagged here as a concrete, scoped follow-on
  rather than done in this ticket, since OpenSSL/POSIX (not Win32
  CryptoAPI or the varargs printf family) was this ticket's authored
  scope.

This is the same class of honest, corpus-shape-driven gap the
`owasp-benchmark-java` and Go/Swift/Kotlin notes above already
document — not a defect in the rules, which are fixture-proven against
real (non-macro-wrapped) C/C++ idioms, and not chased further per the
overfitting guard.

**Overfitting guard:** every rule's pattern targets the general CWE shape
(an unbounded string-copy libc call, a request/environment value reaching
a command/format/path sink, a broken hash/cipher constant, a
security-named variable seeded from a non-cryptographic PRNG, an
unchecked size multiplication) using the real, unwrapped function names
(`strcpy`, `system`, `getenv`, `EVP_md5`, `rand`, `malloc`) — none
reference Juliet's macro names, file-naming scheme, or `manifest.xml`.

**Remaining gap (honest, not closed by this ticket):** recall is 0.007,
not higher, because Juliet's own C/C++ test-generator template wraps
nearly every source/sink in a portability macro and routes several flow
variants through pointer-offset buffer writes, both of which a
literal-function-name pattern rule (by design, and by this file's
overfitting guard) does not chase. A future ticket could add
`pattern-propagators` for `strncat`/`memcpy`-into-a-pointer-offset if a
*real* (non-Juliet) codebase is found to need it, or wire a Juliet-aware
macro-expansion pre-pass — neither is in this ticket's `write_scope`.

## Scorecard

<!-- SCORECARD:START (generated by scripts/scorecard.mjs — do not hand-edit) -->

_Generated by `node scripts/scorecard.mjs` from `corpus/baselines/*.json` — rerun after any `--update-baseline` and commit both together._

Rule corpus: **125** rules across 4 packs (opengrep `packs/` + ast-grep `astgrep/` combined per pack).

### By corpus

| Corpus | TP | FP | FN | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| juice-shop | 1 | 0 | 39 | 1.000 | 0.025 | 0.049 |
| juliet-cpp | 0 | 0 | 2680 | n/a | 0.000 | n/a |
| ossf-cve-benchmark | 0 | 0 | 39 | n/a | 0.000 | n/a |
| owasp-benchmark-java | 524 | 62 | 925 | 0.894 | 0.362 | 0.515 |

### By pack

_Recall/F1 are n/a per pack: the scorer attributes false negatives at the corpus level only (labels aren't tagged with which rule should have caught them), so per-pack recall isn't derivable from the committed baselines without changing what they store._

| Pack | Rules | TP (all corpora) | FP (all corpora) | Precision |
|---|---|---|---|---|
| owasp | 89 | 525 | 62 | 0.894 |
| framework | 17 | 0 | 0 | n/a |
| slop | 13 | 0 | 0 | n/a |
| secrets | 6 | 0 | 0 | n/a |

<!-- SCORECARD:END -->
