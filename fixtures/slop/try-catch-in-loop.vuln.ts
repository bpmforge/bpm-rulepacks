export function loadAll(items: string[]) {
  for (const item of items) {
    try {
      process(item);
    } catch (e) {
      console.log(e);
    }
  }
}
