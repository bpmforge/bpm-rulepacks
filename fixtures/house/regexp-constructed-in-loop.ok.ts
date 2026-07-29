// Compiled once, outside the loops, then reused. Same behaviour, no recompile.
export function scoreParagraphs(paragraphs: string[], terms: string[]): number {
  const compiled = terms.map((t) => new RegExp(`\\b${t}\\b`, "g"));
  let score = 0;
  for (const text of paragraphs) {
    for (const re of compiled) {
      score += (text.match(re) || []).length;
    }
  }
  return score;
}

// A RegExp built once at module scope and used inside a loop must stay clean —
// this is the boundary: it is USE in a loop, not CONSTRUCTION in a loop.
const WORD = new RegExp("\\w+", "g");
export function countWords(lines: string[]): number {
  let n = 0;
  for (const line of lines) n += (line.match(WORD) || []).length;
  return n;
}
