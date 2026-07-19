package config

import "os"

// loadPort falls back to a non-secret default port when PORT is unset.
func loadPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return port
}
