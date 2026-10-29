export function loadAll(items) {
  const results = [];
  for (const item of items) {
    try {
      results.push(process(item));
    } catch (e) {
      results.push(null);
    }
  }
  return results;
}
