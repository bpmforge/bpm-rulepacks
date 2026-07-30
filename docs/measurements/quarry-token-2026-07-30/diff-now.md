# Differential — quarry

CPU findings: 102   LLM findings: 52

| Bucket | Count | Meaning |
|---|---|---|
| BOTH | 24 | covered — stop paying the LLM for this class |
| LLM ONLY | 28 | **mechanization backlog (candidates, not spec)** |
| CPU ONLY | 71 | CPU false positive *or* LLM recall gap |

**CPU-catch-rate: 46.2%** (24/52 locatable LLM findings)

> CPU-catch-rate here is measured against UNTRIAGED LLM output. The real
> KPI is against *triaged-real* findings only. Shipwright's dogfood went
> 55 findings -> 16 claims -> 4 real; a catch-rate over the raw 55 would
> flatter or damn us at random. Triage the LLM-only bucket first.

## LLM-only — triage each before writing any detector

| Location | CWE | Finding |
|---|---|---|
| `src/pipeline.ts:54` | — | Type assertion lies about object shape: `{}` cast to `FetchResult` |
| `src/cli.ts:39` | — | CLI --engines value cast to EngineId[] with no validation |
| `src/mcp.ts:254` | — | Dead defensive check: `seen.has(key)` can never be true here |
| `src/pullmd-serp.ts:172` | — | parseBrave() mixes three unrelated parsing strategies in one 88-line function |
| `src/cli.ts:130` | — | Snippet truncation length is a different, unnamed magic number in two sibling formatters |
| `src/extract/rank.ts:158` | — | Unnamed magic numbers in the early-position ranking boost |
| `src/extract/paywall.ts:48` | — | Paywall heuristic thresholds are unnamed inline magic numbers |
| `src/index.ts:98` | — | search() and searchAll() give callers different error-handling contracts for the same adapters |
| `src/fetch/fetcher.ts:20` | 778 | Core fetch engine has no logger/event hook, unlike the pipeline layer one level up |
| `src/fetch/domainLimit.ts:26` | 778 | Host blacklisting — an important state change — engages with no signal |
| `src/engines/google.ts:108` | 778 | Caught error is only conditionally surfaced; on the non-matching branch it is discarded with no log |
| `src/index.ts:37` | 778 | No correlation/request id anywhere in the library's data contracts |
| `src/fetch/cache.ts:67` | — | Synchronous disk write (mkdirSync + writeFileSync) on cache miss blocks the event loop |
| `src/fetch/fetcher.ts:139` | 400 | Response body read in full with no size cap, unlike bpm-pull.ts's guarded fetch |
| `src/engines/http.ts:67` | 400 | SERP HTML response read in full with no size cap |
| `src/mcp.ts:247` | 1050 | O(n^2) array-scan dedup in the web_search tool instead of the Map-based pattern used elsewhere |
| `src/bpm-pull.ts:242` | — | pull()/get() has no caching, so identical URLs are re-fetched over the network on every call |
| `src/fetch/domainLimit.ts:3` | 401 | Per-host pacing/failure maps grow unbounded for the life of the process |
| `src/fetch/fetcher.ts:96` | 918 | SSRF: fetchAndExtract fetches any caller-supplied URL with no private/internal address filtering |
| `src/bpm-pull.ts:43` | 918 | SSRF: zero-dep pull() fetches arbitrary URLs with no internal-address filtering |
| `src/fetch/fetcher.ts:139` | 400/770 | Uncontrolled response body size in the primary fetch path (no cap, unlike bpm-pull.ts) |
| `src/fetch/robots.ts:51` | 693 | robots.txt end-of-path ($) anchor is silently never honored — both branches of the ternary are identical |
| `src/fetch/robots.ts:51` | — | Ternary's true and false branches are identical — the '$' end-anchor is never applied |
| `src/bpm-pull.ts:146` | — | Hand-rolled regex HTML parser can't handle nested same-name tags, duplicating jsdom which is already a depende |
| `src/mcp.ts:526` | — | normalizeUrl is copy-pasted verbatim across three files instead of being a shared utility |
| `src/mcp.ts:247` | — | Same merge-by-normalized-URL dedup logic duplicated twice in the same file with inconsistent lookup strategy |
| `src/stealth.ts:102` | — | Unused local variable in the injected stealth script |
| `src/cli.ts:91` | — | Help text documents a --debug behavior that the flag does not implement |

## CPU-only — check each against the LLM's miss before claiming recall

| Location | Rule |
|---|---|
| `src/engines/bing.ts:49` | packs.slop.bpm-slop-empty-catch |
| `src/engines/bing.ts:49` | packs.slop.bpm-slop-try-catch-in-loop |
| `src/engines/ddg.ts:98` | packs.slop.bpm-slop-empty-catch |
| `src/engines/ddg.ts:98` | packs.slop.bpm-slop-try-catch-in-loop |
| `src/engines/ddg.ts:145` | packs.slop.bpm-slop-empty-catch |
| `src/extract/readability.ts:25` | packs.slop.bpm-slop-fallback-hides-failure |
| `src/fetch/domainLimit.ts:12` | packs.slop.bpm-slop-fallback-hides-failure |
| `src/pullmd-serp.ts:91` | packs.slop.bpm-slop-fallback-hides-failure |
| `src/decoders.ts:18` | bpm-house-catch-discards-error |
| `src/browser.ts:24` | bpm-house-sync-fs-in-async-fn |
| `src/extract/readability.ts:25` | bpm-house-catch-discards-error |
| `src/extract/readability.ts:32` | bpm-house-catch-discards-error |
| `src/pipeline.ts:67` | bpm-house-catch-discards-error |
| `src/fetch/domainLimit.ts:12` | bpm-house-catch-discards-error |
| `src/pullmd-serp.ts:83` | bpm-house-catch-discards-error |
| `src/pullmd-serp.ts:91` | bpm-house-catch-discards-error |
| `src/pullmd-serp.ts:410` | bpm-house-catch-discards-error |
| `src/pullmd-serp.ts:283` | bpm-house-regexp-constructed-in-loop |
| `src/fetch/robots.ts:77` | bpm-house-catch-discards-error |
| `src/bpm-pull.ts:103` | bpm-house-catch-discards-error |
| `package.json:31` | MANIFEST-VULNERABLE-DEP |
| `package.json:38` | MANIFEST-VULNERABLE-DEP |
| `src/decoders.ts:17` | LODE-DEAD-CODE |
| `src/fetch/cache.ts:35` | LODE-DEAD-CODE |
| `src/fetch/robots.ts:106` | LODE-DEAD-CODE |
| `src/engines/ddg.ts:2` | LODE-PHANTOM-IMPORT |
| `src/engines/google.ts:4` | LODE-PHANTOM-IMPORT |
| `src/bpm-pull.ts:26` | LODE-UNTESTED-SURFACE |
| `src/bpm-pull.ts:38` | LODE-UNTESTED-SURFACE |
| `src/bpm-pull.ts:102` | LODE-UNTESTED-SURFACE |
| `src/bpm-pull.ts:170` | LODE-UNTESTED-SURFACE |
| `src/bpm-pull.ts:238` | LODE-UNTESTED-SURFACE |
| `src/browser.ts:15` | LODE-UNTESTED-SURFACE |
| `src/engines/http.ts:43` | LODE-UNTESTED-SURFACE |
| `src/fetch/domainLimit.ts:11` | LODE-UNTESTED-SURFACE |
| `src/fetch/domainLimit.ts:23` | LODE-UNTESTED-SURFACE |
| `src/fetch/domainLimit.ts:29` | LODE-UNTESTED-SURFACE |
| `src/fetch/domainLimit.ts:33` | LODE-UNTESTED-SURFACE |
| `src/fetch/fetcher.ts:43` | LODE-UNTESTED-SURFACE |
| `src/fetch/robots.ts:74` | LODE-UNTESTED-SURFACE |
| `src/human.ts:6` | LODE-UNTESTED-SURFACE |
| `src/human.ts:9` | LODE-UNTESTED-SURFACE |
| `src/human.ts:11` | LODE-UNTESTED-SURFACE |
| `src/human.ts:25` | LODE-UNTESTED-SURFACE |
| `src/human.ts:33` | LODE-UNTESTED-SURFACE |
| `src/index.ts:45` | LODE-UNTESTED-SURFACE |
| `src/index.ts:88` | LODE-UNTESTED-SURFACE |
| `src/pipeline.ts:110` | LODE-UNTESTED-SURFACE |
| `src/pullmd-serp.ts:35` | LODE-UNTESTED-SURFACE |
| `src/rateLimit.ts:12` | LODE-UNTESTED-SURFACE |
| `src/stealth.ts:137` | LODE-UNTESTED-SURFACE |
| `src/bpm-pull.ts:26` | LODE-SINGLE-USE-HELPER |
| `src/bpm-pull.ts:102` | LODE-SINGLE-USE-HELPER |
| `src/bpm-pull.ts:238` | LODE-SINGLE-USE-HELPER |
| `src/cli.ts:19` | LODE-SINGLE-USE-HELPER |
| `src/cli.ts:111` | LODE-SINGLE-USE-HELPER |
| `src/cli.ts:138` | LODE-SINGLE-USE-HELPER |
| `src/engines/brave.ts:25` | LODE-SINGLE-USE-HELPER |
| `src/engines/ddg.ts:31` | LODE-SINGLE-USE-HELPER |
| `src/engines/ddg.ts:63` | LODE-SINGLE-USE-HELPER |
| … | 11 more |

