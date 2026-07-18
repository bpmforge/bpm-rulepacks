# Finding: missing input validation

It's worth noting that the `/api/users` endpoint accepts unvalidated
query parameters. This is a significant concern that should be fixed
following industry best practices for input sanitization.
