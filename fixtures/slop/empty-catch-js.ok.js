export function load() {
  try { risky(); } catch (e) { logger.error("load failed", e); throw e; }
}
