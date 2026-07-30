# Negative space — what each lens looked for and did NOT find

Scope: all 25 files under `/Users/bmatthews/Code/quarry/src` read in full. No scanner, linter or
static-analysis tool was run. Two shell one-liners were used to *verify* claims I was about to
file (a regex escape class, `String.fromCodePoint` range behaviour) and to check import graphs
(`decoders.ts` is imported only by its test).

---

## security

**Looked for and did not find**

- **Command injection / shell out.** No `child_process`, `exec`, `spawn`, `eval`, `new Function`
  anywhere in `src/`. The only code strings are the Playwright init script (`stealth.ts`) and
  `page.evaluate` bodies, all static literals with no interpolation of user data — `top` is passed
  as a serialized argument, not spliced into source.
- **Path traversal.** `browser.ts:19-23` builds a profile directory from `opts.profileDir` with only
  a `startsWith("/")` check, which would be traversable — but I traced every call site
  (`ddg`/`bing`/`brave`/`google` adapters) and all four pass a hardcoded literal, and
  `SearchOptions.profileDir` is explicitly dropped from the adapter contract by
  `Required<Omit<SearchOptions, "profileDir">>` (`types.ts:24`). Not attacker-reachable; deliberately
  not filed as a vulnerability. The cache path (`cache.ts:39`) is a SHA-1 hex digest — no user
  bytes reach the filesystem path.
- **XSS / HTML injection into the browser.** `page.setContent(html)` (`ddg.ts:83`) loads remote
  HTML, but into a throwaway context whose only job is to be queried, and jsdom is constructed
  without `runScripts`, so remote `<script>` never executes on either path.
- **Secrets.** No API keys, tokens, `.env` reads, credentials or private hosts in source. The
  product's selling point is that it needs none; that holds. `.mcp.json` was not part of `src/`.
- **Prototype pollution.** No recursive merge, no `Object.assign` over parsed JSON, no bracket
  writes with remote keys. The only remote-derived object is the cache entry, which is read, not
  merged.
- **Timing attacks / crypto misuse.** No comparisons of secrets, no auth at all. SHA-1 is used
  only as a cache-key digest, which is a correct non-security use.
- **Authz.** There is no auth surface: the MCP server is stdio-local and the CLI is single-user.
  "Missing authz" does not apply — the trust issue here is SSRF (filed), not access control.
- **Zip/archive/deserialization sinks.** None. The one deserialization sink (`JSON.parse` of the
  cache) is filed under codehealth because the practical impact is a crash, not code execution.

## slop

**Looked for and did not find**

- **Unimplemented stubs / TODO-shaped placeholders / functions that return a constant.** None.
  Every exported function has a real body.
- **Phantom imports / hallucinated packages.** All six runtime dependencies in `package.json` are
  real and all are actually imported. Nothing imports a module that does not exist.
- **Docstring inflation / prose padding.** Comment density is low and the long block comments
  (`bpm-pull.ts:1-11`, `pullmd-serp.ts:1-19`) are accurate history, not filler.
- **Disconnected pipelines.** Only one instance of code wired to nothing was found and it is filed:
  `decoders.ts` (production-dead, test-covered). Every other module is reachable from `cli.ts` or
  `mcp.ts`.
- **Fabricated tests.** Not in scope (I reviewed `src/` only), but I did check that the seven test
  files correspond to real modules; six of seven exercise live code.
- Two *near*-slop items I chose not to file: the stale `trafilatura` comment at
  `pullmd-serp.ts:203` (references a Python library this project never used) and the CLI help line
  `--json ... (required for --enrich)` which the code contradicts (`cli.ts:196-200` handles
  `--enrich` without `--json`). Both are real but cosmetic; the `--debug` flag was filed instead
  because it is documented, plumbed through three layers, and read by nobody.

## performance

**Looked for and did not find**

- **N+1 database access.** There is no database. The nearest analogue — one HTTP fetch per result —
  is inherent to the product and is already bounded by `enrichTop` and a worker pool.
- **Missing caching.** Caching is present and correct at three layers: disk cache for fetches
  (24h TTL), in-memory robots cache (1h TTL), per-host pacing state. The defects here are that the
  disk cache never evicts and that its I/O is synchronous — not that caching is absent.
- **Unbounded response reads on the pull path.** `bpm-pull.ts` enforces `MAX_BYTES` both by
  `Content-Length` and while streaming, and cancels the reader on overflow. This is the correct
  implementation; its absence in `fetch/fetcher.ts` is what made that finding worth filing.
- **Serial awaits that should be parallel.** The three fan-out sites (`searchAll`,
  `pullmdSearch`, `web_research_pullmd`) all use `Promise.all`/`allSettled` correctly, and
  `pipeline.pool` is a proper bounded worker pool rather than an unbounded `Promise.all`.
- **try/catch inside hot loops.** Checked the BM25 scorer, the markdown converter and the paywall
  detector: no exception handling on the per-item path.
- **Unbounded long-lived growth.** Found several (`robots.ts` cache map, `domainLimit` maps and
  blacklist, `bpm-pull` `lastFetchAt`, the disk cache). I filed the disk cache and the blacklist
  (the latter under logging, where its real cost is invisibility) and deliberately did not file the
  three in-memory host maps separately — they are keyed by hostname, bounded in practice by the
  number of distinct hosts a session touches, and filing four instances of one pattern is padding.

## codehealth

**Looked for and did not find**

- **`any` escapes.** Zero occurrences of `: any` or `as any` in `src/`. `tsconfig.json` is strict
  and `npm run lint` is `tsc --noEmit`, so the type discipline is real. The lies that exist are
  narrower: `{} as FetchResult`, `JSON.parse(...) as CacheEntry`, `split(",") as EngineId[]` — all
  filed.
- **Non-null assertions covering real nullability.** The file is dense with `!` (e.g. `m[1]!`,
  `items[i]!`), but each one I traced is provably non-null from the regex arity or the loop bound.
  I did not file them; the exception is `results[i]` under a NaN concurrency, which is filed as
  part of the `parseInt` finding.
- **God functions.** The longest function is `web_research_pullmd`'s handler (~75 lines). It does
  more than one job, but each step is legible and linear; I judged it below the filing bar rather
  than pad the count.
- **Magic numbers.** Present throughout (`html.length < 500`, `textLength < 800`, `< 0.05`,
  `slice(0, 5000)`, `>= 25`, `>= 40`). These are tuning constants in a heuristic extractor, which is
  the one place magic numbers are defensible. Not filed — naming them would not change behaviour or
  reveal a bug. The one numeric constant that *does* encode a broken contract (`FAILURE_BLACKLIST_AFTER`
  with no expiry) is filed under logging.
- **Inconsistent sibling contracts.** Found four and filed them all (three `normalizeUrl` copies,
  `headless` passed by three MCP handlers and omitted by the fourth, three different error-handling
  contracts across the four engine adapters, two different notions of "main content"). This lens
  produced the most findings precisely because the duplication is systematic.

## logging

**Looked for and did not find**

- **Any logging framework, log level, or structured logger.** There is none — three `console.*`
  calls exist in 3,644 lines (`cli.ts:82` help, `cli.ts:218` fatal, `mcp.ts:555` fatal), and all
  three are terminal output, not observability. So "layers with no observability hook while adjacent
  layers have one" is technically inapplicable: *no* layer has one. I filed the four places where
  the absence destroys specific, already-computed diagnostic information rather than filing "no
  logging" thirty-seven times.
- **Correlation / request IDs.** Absent, as expected given the above. Not filed as its own finding:
  with no log sink, a correlation ID would have nothing to correlate. It becomes a real gap the
  moment any of the four filed findings is fixed — the MCP `progressToken` (`mcp.ts:161`) is the
  natural carrier and already exists.
- **Log injection / secrets in logs.** Nothing is logged, so neither can occur. The one place raw
  remote text reaches an output stream is the tool result itself, which is the product.
- **Silent catches that are genuinely fine.** Not every empty catch was filed. The `.catch(() => false)`
  guards around Playwright `isVisible()` in the four `dismissConsent` helpers are correct — "is this
  consent button present" legitimately has no error case. Likewise the jsdom `VirtualConsole`
  suppressors (`http.ts:36-38`, `readability.ts:20-22`) intentionally silence CSS/JS parse noise from
  third-party pages, which is the documented use of that API. Filing those would be noise.
