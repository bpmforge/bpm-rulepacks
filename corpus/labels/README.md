# Normalized ground-truth labels

Each corpus has one `<name>.json` here — the normalized ground truth that `scripts/score-corpus.mjs` reads. An **adapter** converts the corpus's native label format into this shape (run once per corpus bump, output committed here — the labels are small, unlike the corpus itself which is never vendored).

## Format

```json
[
  { "file": "src/routes/login.js", "line": 42, "cwe": ["89"], "kind": "vuln" },
  { "file": "src/routes/login.js", "line": 51, "cwe": [],      "kind": "safe" }
]
```

- `file` — path relative to the corpus root (the scorer matches on the last two path segments, so minor prefix differences are tolerated).
- `line` — optional. Omit for file-level labels; the scorer is line-tolerant (±2) when present.
- `cwe` — array of CWE numbers (strings, no `CWE-` prefix). Used to match a finding to a label: a finding counts as a true positive only if its rule's `metadata.cwe` overlaps the label's CWE. This is why every rule must carry `metadata.cwe`.
- `kind` — `"vuln"` (a real flaw the rule should catch → drives recall) or `"safe"` (a deliberately-safe line the rule must NOT flag → drives precision, catches false positives).

## Adapters (per corpus native format)

Write a small `adapters/<name>.mjs` that reads the fetched corpus and emits `<name>.json`. Known native formats to convert:
- **NIST Juliet** — `manifest.xml` (per-test-case CWE + flaw line).
- **OWASP Benchmark** — `expectedresults-1.2.csv` (test name → real/fake + CWE).
- **\*Goat apps / DVWA** — usually prose docs; hand-label the specific sinks into a small `<name>.json` (still counts as ground truth).

Keep adapters deterministic and re-runnable so a corpus SHA bump regenerates labels cleanly.
