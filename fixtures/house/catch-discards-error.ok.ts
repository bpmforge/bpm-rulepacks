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
