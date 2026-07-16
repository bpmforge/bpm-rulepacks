export function loadItems(): Item[] {
  try {
    return fetchItems();
  } catch {
    return [];
  }
}
