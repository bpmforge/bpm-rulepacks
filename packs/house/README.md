# `house` — rules derived from observed LLM findings

Every rule here exists because an LLM code review found a real defect that no
CPU rule caught, and we then asked *"what would have caught this mechanically?"*

That origin is recorded on each rule as
`provenance: derived:<repo>/<finding-id>`, so the flywheel is auditable: at any
point we can say which rules came from observed behaviour versus were authored
blind, and which finding justified each one.

**The bar for entry:** a rule belongs here only if it fires on the *shape* of the
defect, not on the text of the repo it came from. A rule that would only ever
match the codebase that motivated it is overfitting, not mechanization — it goes
back for a redesign or is recorded as judgment-only.
