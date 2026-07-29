// One RegExp compiled per query term, per paragraph — the pattern is rebuilt
// on every iteration of a loop that is itself nested inside another loop.
export function scoreParagraphs(paragraphs: string[], terms: string[]): number {
  let score = 0;
  for (const text of paragraphs) {
    for (const term of terms) {
      const re = new RegExp(`\\b${term}\\b`, "g");
      score += (text.match(re) || []).length;
    }
  }
  return score;
}
