# juice-shop — first baseline (2026-07-16)

## What this is

`corpus/adapters/juice-shop.mjs` normalizes OWASP Juice Shop's inline
`// vuln-code-snippet` challenge markers into `corpus/labels/juice-shop.json`,
and produced `corpus/baselines/juice-shop.json` via
`npm run score -- juice-shop --update-baseline`.

## Result

```
TP=1 FP=0 FN=39
precision=1.000  recall=0.025  F1=0.049
```

`perRule` (from the baseline file): only `bpm-owasp-a03-sql-string-concat`
scored a hit (tp:1) — it caught one of the two raw-SQL-string-concatenation
challenges. Ten other rules fired somewhere in the ~950-file app but never on
a labeled line (`unlabeled` counts, e.g. `bpm-framework-fastify-route-missing-schema`
fired 271 times — noise on this corpus, not evaluated either way since it
never lands on a `vuln`/`safe` label).

## Label extraction

113 challenges are defined in `data/static/challenges.yml`; only **33 have
inline `vuln-code-snippet` markers** (the rest are "use the running app" /
client-side-enumeration challenges with no single vulnerable source line — not
something a SAST rule can target, and not a gap in this adapter).

Juice Shop's markers are more precise than a plain start/end block: they
tag individual lines as `vuln-line` (the actual flaw), `neutral-line` (shown
in the snippet, explicitly *not* the flaw), or `hide-line`/`hide-start`/
`hide-end` (challenge-engine plumbing never shown to the player). This
adapter uses:
- `vuln-line` → `kind:"vuln"` (precise, author-asserted ground truth)
- `neutral-line` → `kind:"safe"` (near-identical code in the same block the
  authors assert is *not* the flaw — this is exactly the false-positive
  signal `docs/TESTING.md` says matters)
- `hide-*` → skipped (not meaningful vuln/safe application code)
- A block (`start`..`end`) that never contains a `vuln-line` for one of its
  keys falls back to labeling the `start` line as `vuln`, so the challenge
  isn't silently dropped from recall. Every marked challenge in this corpus
  revision (20.1.1, SHA `33518f5a`) has at least one `vuln-line`, so this
  path is currently unused — it's a guard for future Juice Shop versions.

Result: **115 labels (41 vuln, 74 safe)** across 13 files (`server.ts`,
`routes/{login,search,chat,updateProductReviews}.ts`, `models/user.ts`,
`lib/insecurity.ts`, `data/static/securityQuestions.yml`,
`data/static/web3-snippets/*.sol`, `frontend/src/app/{app.routing,
search-result/search-result.component}.ts`).

Note some vuln labels share a `(file, line, cwe)` position when multiple
challenge keys with the *same* CWE mark the same line (e.g.
`loginAdminChallenge`/`loginBenderChallenge`/`loginJimChallenge` all mark
`routes/login.ts:34` as CWE-89) — the scorer keys a match on
`(file, line, cwe)`, so these correctly count as one recall opportunity, not
three; they are not deduplicated in the labels file itself (each challenge
key's own label is worth keeping in case rules ever diverge on CWE
specificity per key).

## Marker parsing note (why not a naive grep)

`lib/codingChallenges.ts` contains the marker *grammar itself* as regex/string
literals (e.g. `` `[/#]{0,2} vuln-code-snippet start (?<challenges>.*)/g` ``),
and `.ai/skills/verify-rsn-fix/SKILL.md` / `AGENTS.md` mention markers in
prose. A naive substring search over all matches false-positives on both. The
adapter requires the marker keyword to be immediately preceded by a real line
comment opener (`//` or `#`) and restricts scanning to source extensions
(`.ts .js .mjs .cjs .yml .yaml .sol`, no `.md`) — verified empirically: the
regex-literal lines in `codingChallenges.ts` do not match (no `//`/`#`
immediately before `vuln-code-snippet`), and `.md` files are never scanned.

## challenge key → CWE mapping

`data/static/challenges.yml` gives each challenge a `category`
(e.g. `Injection`, `Broken Access Control`). Base mapping (16 categories):

| Category | CWE |
|---|---|
| Broken Access Control | 284 |
| Broken Anti Automation | 799 |
| Broken Authentication | 287 |
| Cryptographic Issues | 327 |
| Improper Input Validation | 20 |
| Injection | 74 |
| Insecure Deserialization | 502 |
| Miscellaneous | 710 |
| Observability Failures | 532 |
| Security Misconfiguration | 16 |
| Security through Obscurity | 656 |
| Sensitive Data Exposure | 200 |
| Unvalidated Redirects | 601 |
| Vulnerable Components | 1104 |
| XSS | 79 |
| XXE | 611 |

Per-challenge-key overrides applied where the actual marked code shape
supports a more precise CWE than the category default (best-effort, not a
normative CWE assignment — flagged here so a human can correct any of these):

| Key | CWE | Why |
|---|---|---|
| unionSqlInjectionChallenge, dbSchemaChallenge, loginAdminChallenge, loginBenderChallenge, loginJimChallenge | 89 | raw SQL string concatenation, visibly SQLi (category default would be generic 74) |
| noSqlReviewsChallenge | 943 | MongoDB query built from unsanitized input — NoSQL injection |
| forgedReviewChallenge | 639 | authorization bypass via user-controlled `id` (IDOR), more specific than category's generic 284 |
| changeProductChallenge | 862 | commented-out authorization middleware — missing authorization, more specific than 284 |
| registerAdminChallenge | 915 | mass-assignment of a role/admin field |
| weakPasswordChallenge | 521 | weak password policy accepted at hash time |
| resetPasswordMortyChallenge | 307 | rate-limiter keyed on spoofable `X-Forwarded-For` — excessive-attempts bypass |
| resetPassword{Bender,Bjoern,BjoernOwasp,Jim,Uvogin}Challenge | 640 | guessable/public security-question-based recovery — weak password recovery mechanism, more specific than category's generic 287 |
| directoryListingChallenge | 548 | literal directory listing exposure |
| exposedMetricsChallenge | 200 | unauthenticated `/metrics` endpoint exposure |
| restfulXssChallenge, localXssChallenge, xssBonusChallenge | 79 | `bypassSecurityTrustHtml` sinks — category (Miscellaneous/XSS) already implies 79 for the XSS-categorized ones; restfulXssChallenge is explicitly categorized `XSS` too |
| chatbotGreedyInjectionChallenge, chatbotPromptInjectionChallenge | 1427 | LLM prompt injection — CWE-1427 (Improper Neutralization of Input Used for LLM Prompting) is the closest fit; this is a newer, less battle-tested CWE ID, called out explicitly as a judgment call |
| web3WalletChallenge | 841 | Solidity reentrancy-shaped balance-update-after-external-call — CWE-841 (Improper Enforcement of Behavioral Workflow), the common CWE used for reentrancy |

Everything else (`nftMintChallenge`, `nftUnlockChallenge`,
`adminSectionChallenge`, `scoreBoardChallenge`, `web3SandboxChallenge`,
`tokenSaleChallenge`, `accessLogDisclosureChallenge`,
`redirectChallenge`, `redirectCryptoCurrencyChallenge`) uses the category
default from the table above.

## Honest observations

- **Recall is low (0.025) and that is expected, not a scoring bug.** Our
  ruleset is generic (OWASP-shaped: SQLi, path traversal, SSRF, hardcoded
  secrets, plaintext-password-compare, JWT secrets, plus AI-slop patterns) —
  it was not authored against Juice Shop's specific vulnerable code shapes.
  Of the 41 vuln labels, only the two SQL-string-concatenation sites are the
  kind of pattern our current rules target at all; one of the two was caught.
  The other 39 (NoSQLi, IDOR, mass assignment, weak password recovery,
  prompt injection, directory listing, redirect, XSS via
  `bypassSecurityTrustHtml`, reentrancy, etc.) have no corresponding rule yet
  in `packs/` or `astgrep/`.
- **Precision is 1.000 on this pass** — no rule fired on a `neutral-line`
  (`safe`) label. That's a real signal (74 safe labels exercised, 0 false
  hits) but a small one — most of our findings (309 across the 11 rules that
  fired anywhere) landed on *unlabeled* lines, which the scorer correctly
  does not count either way (an unlabeled line isn't ground truth in either
  direction — see `scripts/score-corpus.mjs` comment on this design choice).
  `bpm-framework-fastify-route-missing-schema` alone accounts for 271 of
  those unlabeled findings — real signal on Juice Shop's Fastify-shaped
  routes, unrelated to the marked coding challenges.
- **This is a whole-app integration target, not a synthetic per-line
  benchmark** (unlike OWASP Benchmark or Juliet) — most of its 113
  challenges are exploited by *using* the running app (URL enumeration,
  client flows, multi-step attacks), not by finding one bad line. Only the
  33 marker-tagged "coding challenges" could become line-level labels at
  all; whole-app dynamic-only challenges are out of scope for a static-rule
  scorer by construction, not a coverage gap in this adapter.
- **Not tuned.** Per the ticket, no rule was touched to raise this number —
  the low recall documents real ruleset gaps for a future rule-authoring
  ticket (NoSQLi, IDOR/mass-assignment, weak-password-recovery, and
  prompt-injection patterns are the most Juice-Shop-relevant gaps this
  baseline surfaces).

## To re-run

```
CORPUS_DIR=~/.cache/bpm-rulepacks-corpus node corpus/adapters/juice-shop.mjs
CORPUS_DIR=~/.cache/bpm-rulepacks-corpus npm run score -- juice-shop --update-baseline
```
