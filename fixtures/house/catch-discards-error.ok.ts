// The error is bound and attached to the returned value, so the caller can
// tell a corrupt entry from a missing one.
export function readEntry(p: string): { entry: unknown | null; error?: unknown } {
  try {
    return { entry: JSON.parse(readFileSync(p, "utf8")) };
  } catch (err) {
    return { entry: null, error: err };
  }
}

// Bound and rethrown with context — also fine.
export function readStrict(p: string): unknown {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (err) {
    throw new Error(`cache entry unreadable at ${p}`, { cause: err });
  }
}

// An EMPTY bindingless catch is bpm-slop-empty-catch's finding, not this
// rule's. It must stay clean here so the two rules never double-report.
export function bestEffort(p: string): void {
  try {
    unlinkSync(p);
  } catch {}
}

// ── Two families this rule claimed could not exist. ──────────────────────────
// Its metadata asserted "Every one is CORRECT by construction ... There are no
// false positives here." That conflated two different claims: the error OBJECT
// is unreachable (a syntactic fact, always true) and the FAILURE is silently
// swallowed (an inference, and false for both shapes below).

// Rethrow as a domain error. The caller still gets an error; the failure is not
// destroyed. Losing the original via no `{ cause }` is a real but far weaker
// finding, and it is not the one this rule's message describes.
// Real shape: repopulse ForgeSsrfError.
export function parseUrlOrThrow(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new ForgeSsrfError("not a valid URL", url);
  }
}

// Handler logs. This rule's message says an operator "sees a degraded result
// with no way to learn why" — untrue when the handler writes to the log.
// Real shape: threatforge webhook-retry.
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await db.users.touch(userId);
  } catch {
    console.error("Failed to update lastLoginAt for OAuth login", { userId });
  }
}
