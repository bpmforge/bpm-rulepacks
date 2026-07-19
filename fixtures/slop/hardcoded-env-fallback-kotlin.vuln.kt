package com.example.config

class ApiConfig {
    // apiKey falls back to a hardcoded production-shaped credential when
    // API_KEY is unset instead of failing closed.
    val apiKey: String = System.getenv("API_KEY") ?: "sk-prod-fallback-key"
}
