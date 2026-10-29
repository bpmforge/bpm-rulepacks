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

// Parse-or-fallback over a value already in hand: the parser's error says
// only "this string is not a URL / not JSON", which the fallback already
// means. Nothing operational is lost. 25 of 30 sampled outline hits were this.
export function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

export function parseState(state: string): unknown {
  try {
    return JSON.parse(state);
  } catch {
    return undefined;
  }
}
