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

// ── The three families this rule reported on the fleet and should not. ───────
// 31 of 51 raw hits. Each is a real shape from shipwright / threatforge /
// lodestone, kept here so a future widening has to walk past them.

// INBOUND request body. Real risk, DIFFERENT class: the client picks the size
// and the fix is a body limit at the framework or proxy, not a content-length
// check on a response. Calling this "a network response body" is simply wrong.
export async function routeHandler(req: Request): Promise<string> {
  const body = await req.text();
  return body;
}

// Browser File API. The user chose this file off their own disk — no remote
// endpoint decides the size, so the CWE-400 framing does not apply.
export async function importDocument(file: File): Promise<string> {
  const content = await file.text();
  return content;
}

// Error-path read: buffering a FAILED response to put in the message. A
// universal idiom against a configured endpoint; at 13 of 51 hits it drowned
// the class this rule exists to find.
export async function callProvider(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`provider failed: ${error}`);
  }
  return "ok";
}
