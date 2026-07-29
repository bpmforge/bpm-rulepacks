// The branches genuinely differ — the condition selects between them.
export function anchorRule(rule: string, escaped: string): string {
  return rule.endsWith("$") ? `^${escaped}$` : `^${escaped}`;
}

// Same shape, different values — must stay clean.
export function pick(flag: boolean): number {
  return flag ? 1 : 2;
}
