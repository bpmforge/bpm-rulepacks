export function loadItems() {
  try {
    return fetchItems();
  } catch (e) {
    logger.error("loadItems failed", e);
    return { error: "items_unavailable", cause: e };
  }
}
