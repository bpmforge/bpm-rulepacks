import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";

// The promise API — the event loop stays free while the disk works.
export async function cacheResponse(path: string, body: string): Promise<void> {
  await mkdir("/tmp/cache", { recursive: true });
  await writeFile(path, body, "utf8");
}

// A sync read in a SYNCHRONOUS function is out of this rule's scope: it makes
// no concurrency promise to break. This pins the boundary.
export function loadConfigAtStartup(path: string): string {
  return readFileSync(path, "utf8");
}
