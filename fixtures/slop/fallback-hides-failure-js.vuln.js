export function loadItems() {
  try {
    return fetchItems();
  } catch {
    return [];
  }
}
