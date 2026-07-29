import { writeFileSync, mkdirSync } from "node:fs";

// Sync disk I/O inside an async function: this blocks the event loop for the
// duration of the write, stalling every other in-flight request.
export async function cacheResponse(path: string, body: string): Promise<void> {
  mkdirSync("/tmp/cache", { recursive: true });
  writeFileSync(path, body, "utf8");
  await Promise.resolve();
}
