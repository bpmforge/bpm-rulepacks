// A symbol name pulled out of scanned source is interpolated straight into a
// RegExp. Any metacharacter in it changes what the pattern means, and a crafted
// value can produce catastrophic backtracking.
export function countRefs(binding: { name: string }, text: string): number {
  const re = new RegExp(`\\b${binding.name}\\b`, "g");
  return (text.match(re) || []).length;
}
