export function loadAll(items: string[]) {
  try {
    for (const item of items) {
      process(item);
    }
  } catch (e) {
    logger.error("loadAll failed", e);
    throw e;
  }
}

// Per-item handling that looks at the error is not swallowing it (outline's
// WebsocketProvider removes a document on NotFoundError and rethrows the rest).
export async function refreshAll(ids: string[]) {
  for (const id of ids) {
    try {
      await documents.fetch(id, { force: true });
    } catch (err) {
      if (err instanceof NotFoundError) {
        documents.remove(id);
        continue;
      }
      throw err;
    }
  }
  for (const id of ids) {
    try {
      await attachments.read(id);
    } catch (err) {
      Logger.warn("Failed to read attachment", { id, error: errToString(err) });
    }
  }
}

// A bounded retry keeps the last error and decides on it.
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3) {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = toError(err);
    }
  }
  throw lastError;
}
