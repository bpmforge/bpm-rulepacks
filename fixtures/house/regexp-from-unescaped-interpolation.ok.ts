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
