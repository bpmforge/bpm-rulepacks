export function tryParseConfig(input: string): Config | null {
  const result = safeJsonParse(input);
  if (result === null) {
    logger.warn("config parse failed, using safe default path");
  }
  return result;
}

function safeJsonParse(input: string): Config | null {
  if (!looksLikeJson(input)) return null;
  return JSON.parse(input);
}
