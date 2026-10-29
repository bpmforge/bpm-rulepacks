module.exports = {
  // Not a literal at all — fails the quoted-value requirement.
  jwtSecret: process.env.JWT_SECRET,

  // Keyword embedded MID-word, not as the final identifier component. This is
  // the boundary the camelCase fix must not cross. Confirmed to stay clean for
  // THAT reason and not incidentally: the same key with a space-free 22-char
  // value ("JaneDoeFromAccounting1") still does not fire, so the trailing \b is
  // doing the work, not the regex's no-whitespace requirement.
  userSecretary: "Jane Doe from Accounting",
  tokenizer: "gpt-4-tokenizer-config",

  // Suffix cases for the `password` and `api_key` branches. Only `secret` and
  // `token` were exercised by any fixture before; these two alternation
  // branches went untested in both directions.
  passwordPolicy: "min12-upper-lower-digit",
  apiKeyHeader: "x-acme-api-key-header-v2",

  // A variable dereference is secret HANDLING, not a hardcoded secret.
  // PGPASSWORD="$PGPASSWORD_VAL" was firing inside a real repo's own
  // egress-audit script before this exclusion existed.
  dbPassword: "$DATABASE_PASSWORD",

  // Documentation-style placeholder telling the reader to supply their own.
  anthropicApiKey: "your-anthropic-key-here",
};

// A key NAMED after a credential whose value is an identifier or a URL is a
// field mapping, an enum label or an endpoint, not a secret. 17 of 18 hits
// on the walkthrough repos were this (Swift CodingKeys, OAuth endpoint maps,
// saleor error codes, outline's TeamPreference enum).
const keys = {
  clientSecret: "client_secret_value",
  accessToken: "access_token",
  membersCanCreateApiKey: "membersCanCreateApiKey",
  token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
};
