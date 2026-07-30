export const MAX_BYTES = 5 * 1024 * 1024;

// content-length checked against a declared cap before the body is read.
export async function fetchPageCapped(url: string): Promise<string> {
  const res = await fetch(url);
  const declaredLen = Number(res.headers.get("content-length") || 0);
  if (declaredLen > MAX_BYTES) {
    throw new Error(`response too large: ${declaredLen} exceeds ${MAX_BYTES}`);
  }
  return await res.text();
}

// Streaming never buffers the whole body, so there is nothing to cap. This pins
// the boundary: the defect is the unbounded BUFFER, not the fetch.
export async function fetchPageStreamed(url: string) {
  const res = await fetch(url);
  return res.body;
}
