package com.example.config;

import java.util.Optional;

public class Config {

    public String apiSecret() {
        return Optional.ofNullable(System.getenv("API_SECRET")).orElse("sk-prod-abc123xyz");
    }
}
