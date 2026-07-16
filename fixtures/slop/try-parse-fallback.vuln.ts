export function parseConfig(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return defaultValue;
  }
}
