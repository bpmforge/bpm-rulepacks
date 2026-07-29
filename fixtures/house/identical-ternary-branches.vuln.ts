// Both branches are the same expression, so the `$`-suffix test does nothing:
// an end-anchored rule is never actually anchored.
export function anchorRule(rule: string, escaped: string): string {
  return rule.endsWith("$") ? `^${escaped}` : `^${escaped}`;
}
