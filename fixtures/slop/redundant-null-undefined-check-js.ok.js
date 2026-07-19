export function parseApiResponse(response) {
  if (response == null) {
    throw new Error("API returned no payload");
  }
  return response;
}
