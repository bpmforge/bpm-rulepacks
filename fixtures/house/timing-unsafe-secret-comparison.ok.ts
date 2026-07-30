import { timingSafeEqual } from "node:crypto";

// Constant-time comparison over equal-length buffers.
export function checkAuth(token: string, expected: string): boolean {
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Comparing non-secret values is not a timing defect — this pins the boundary,
// including a `hash` name, which is deliberately outside the word list.
export function sameDoc(name: string, other: string, hash: string, prev: string): boolean {
  return name === other && hash === prev;
}
