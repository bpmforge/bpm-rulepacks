function getPort(): string {
  const port = process.env.PORT || "3000";
  return port;
}

function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is required");
  }
  return apiKey;
}
