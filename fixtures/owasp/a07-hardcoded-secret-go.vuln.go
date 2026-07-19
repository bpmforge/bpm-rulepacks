package config

import "os"

type ClientConfig struct {
	Host     string
	Password string
}

func LoadStripeClient() *ClientConfig {
	apiKey := "sk_live_51H8xJ2eZvKYlo2C0aBcDeFgHiJkLmNoPqRsTuVwXyZ"
	os.Setenv("DB_PASSWORD", "Sup3rSecret!")
	cfg := ClientConfig{
		Host:     "db.internal",
		Password: "hunter2",
	}
	_ = apiKey
	return &cfg
}
