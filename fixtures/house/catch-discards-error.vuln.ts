// Bindingless catch with a recovery body: the cache read failed for SOME
// reason — corrupt JSON, permissions, a truncated write — and that reason is
// gone. Every failure is indistinguishable from a cache miss.
export function readEntry(p: string): unknown | null {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}
