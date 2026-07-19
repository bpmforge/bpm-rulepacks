export function loadAll(items) {
  for (const item of items) {
    try {
      process(item);
    } catch (e) {
      console.log(e);
    }
  }
}
