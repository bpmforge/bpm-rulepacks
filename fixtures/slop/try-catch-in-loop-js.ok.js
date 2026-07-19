export function loadAll(items) {
  try {
    for (const item of items) {
      process(item);
    }
  } catch (e) {
    logger.error("loadAll failed", e);
    throw e;
  }
}
