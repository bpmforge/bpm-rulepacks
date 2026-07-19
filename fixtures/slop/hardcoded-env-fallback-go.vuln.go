package config

import "os"

// loadAPIKey falls back to a hardcoded production-shaped credential when
// API_KEY is unset instead of failing closed.
func loadAPIKey() string {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		apiKey = "sk-prod-fallback-key"
	}
	return apiKey
}
