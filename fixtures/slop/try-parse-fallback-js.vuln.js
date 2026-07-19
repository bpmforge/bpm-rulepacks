export function parseConfig(input) {
  try {
    return JSON.parse(input);
  } catch {
    return defaultValue;
  }
}
