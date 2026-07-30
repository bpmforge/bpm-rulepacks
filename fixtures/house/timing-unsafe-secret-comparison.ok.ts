import { timingSafeEqual } from "node:crypto";

// Constant-time comparison over equal-length buffers.
export function checkAuth(token: string, expected: string): boolean {
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Comparing non-secret values is not a timing defect — this pins the boundary,
// including a `hash` name, which is deliberately outside the word list.
export function sameDoc(
  name: string,
  other: string,
  hash: string,
  prev: string,
): boolean {
  return name === other && hash === prev;
}

// ── The ten real fleet false positives that v1 of this rule reported. ────────
// Each one was triaged by hand across shipwright / threatforge / lodestone and
// found benign. They live here so a future widening has to walk past them.

// same-receiver: two configured identities asserted to DIFFER. Nobody submits
// either side, so there is no channel to time.
export function makerIsNotReviewer(config: {
  makerToken: string;
  reviewerToken: string;
}): boolean {
  return config.makerToken === config.reviewerToken;
}

// both-sides-secret: `signature` here is a CODE SYMBOL signature and `name` is
// not a secret at all. Only one operand is credential-shaped.
export function symbolDrifted(s: { signature: string; name: string }): boolean {
  return s.signature.trim() !== s.name;
}

// mirrored-property: the same field read off two records — a diff check between
// two benchmark results, where `identTokens` are parser tokens, not credentials.
export function benchDiffers(
  seq: { identTokens: number },
  fan: { identTokens: number },
): boolean {
  return seq.identTokens !== fan.identTokens;
}

// length-comparison: format validation. Leaks the length, which is not secret.
export function looksLikeToken(token: string, TOKEN_PREFIX: string): boolean {
  return (
    token.startsWith(TOKEN_PREFIX) && token.length === TOKEN_PREFIX.length + 64
  );
}

// confirmation-field: both sides typed by the same user into the same form.
export function passwordsMatch(
  password: string,
  confirmPassword: string,
): boolean {
  return password === confirmPassword && confirmPassword.length > 0;
}
export function profileMismatch(
  newPassword: string,
  confirmPassword: string,
): string {
  if (newPassword !== confirmPassword) return "mismatch";
  return "ok";
}
