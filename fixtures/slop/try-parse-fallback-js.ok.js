export function tryParseConfig(input) {
  const result = safeJsonParse(input);
  if (result === null) {
    logger.warn("config parse failed, using safe default path");
  }
  return result;
}

function safeJsonParse(input) {
  if (!looksLikeJson(input)) return null;
  return JSON.parse(input);
}
