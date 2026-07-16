export function loadItems(): Item[] | ItemsError {
  try {
    return fetchItems();
  } catch (e) {
    logger.error("loadItems failed", e);
    return { error: "items_unavailable", cause: e };
  }
}
