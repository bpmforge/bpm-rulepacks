package com.example.config

class ApiConfig {
    // port falls back to a non-secret default when PORT is unset.
    val port: String = System.getenv("PORT") ?: "8080"
}
