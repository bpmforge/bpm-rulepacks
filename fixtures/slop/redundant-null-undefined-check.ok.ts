export function parseApiResponse(response: unknown): ApiPayload {
  if (response == null) {
    throw new Error("API returned no payload");
  }
  return response as ApiPayload;
}
