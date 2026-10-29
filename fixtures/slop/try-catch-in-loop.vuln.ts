export function loadAll(items: string[]) {
  const results: (string | null)[] = [];
  for (const item of items) {
    try {
      results.push(process(item));
    } catch {
      results.push(null);
    }
  }
  return results;
}
