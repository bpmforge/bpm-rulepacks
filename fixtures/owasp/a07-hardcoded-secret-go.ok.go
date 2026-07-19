package config

import "os"

type ClientConfig struct {
	Host     string
	Password string
}

func LoadStripeClient() *ClientConfig {
	apiKey := os.Getenv("STRIPE_API_KEY")
	os.Setenv("DB_PASSWORD", os.Getenv("DB_PASSWORD_SEED"))
	cfg := ClientConfig{
		Host:     "db.internal",
		Password: os.Getenv("DB_PASSWORD"),
	}
	_ = apiKey
	return &cfg
}
