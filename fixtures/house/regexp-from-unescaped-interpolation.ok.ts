declare function escapeRegExp(s: string): string;

// The interpolated value goes through an escape helper first.
export function countRefs(binding: { name: string }, text: string): number {
  const re = new RegExp(`\\b${escapeRegExp(binding.name)}\\b`, "g");
  return (text.match(re) || []).length;
}

// A fully literal pattern has nothing to escape — this pins the boundary: the
// defect is the raw INTERPOLATION, not the use of RegExp.
export function countFixed(text: string): number {
  return (text.match(new RegExp("\\bfixed\\b", "g")) || []).length;
}

// ── Escaped on the PREVIOUS line, then interpolated as a bare identifier. ────
// This is the commonest correct form and v1 flagged all three of its fleet
// occurrences (repopulse bots.ts + dora.ts, threatforge mention-notifications).
// Accusing the code that does it right is the one failure this rule's own
// metadata calls worse than missing some, so it is pinned here.
export function matchesBot(ua: string, raw: string): boolean {
  const escaped = escapeRegExp(raw);
  return new RegExp(`^${escaped}$`, "i").test(ua);
}

export function mentionsUser(body: string, handle: string): boolean {
  const escapedHandle = escapeRegExp(handle);
  return new RegExp(`@${escapedHandle}(?=\\s|$|[^A-Za-z])`, "i").test(body);
}
