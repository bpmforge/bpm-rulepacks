# Finding: missing input validation

The `/api/users` endpoint accepts unvalidated query parameters. Add
schema validation (OWASP A03:2021, Input Validation Cheat Sheet) before
the value reaches the query builder.
