// The same delimiter written as a visible escape: same runtime behaviour,
// reviewable in a diff, and safe from a well-meant cleanup.
export function joinTokens(toks: string[]): string {
  return toks.join("\u0001");
}

// Ordinary whitespace is NOT a control-character defect. This pins the
// boundary: tab, newline and carriage return are visible by convention in
// source and are deliberately outside the rule's character class.
export function joinLines(lines: string[]): string {
  return lines.join("\n") + "\t";
}
