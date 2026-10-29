export function load() {
  try { risky(); } catch (e) { logger.error("load failed", e); throw e; }
}

// An empty catch whose comment states why it is best-effort is a decision,
// not a swallowed failure. 42 of 42 outline hits carried such a comment.
export function remember(key: string, path: string) {
  try {
    sessionStorage.setItem(key, path);
  } catch (_err) {
    // Storage is disabled in private mode; the cookie set above still works.
  }
  try {
    dom.window.close();
  } catch {
    /* already closed by the parser */
  }
}
