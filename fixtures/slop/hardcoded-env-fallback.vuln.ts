function getApiKey(): string {
  const apiKey = process.env.API_KEY || "prod-fallback-key-12345";
  return apiKey;
}
