package com.example.config

class ApiConfig {
    val apiKey = "sk_live_51H8x9KZvB2n4gT7pQmR3sYw"
    var password: String = "SuperSecretPass123!"

    fun connect() {
        val authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        println(authToken)
    }
}
