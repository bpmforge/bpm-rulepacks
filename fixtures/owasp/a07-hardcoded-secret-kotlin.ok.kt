package com.example.config

class ApiConfig {
    val apiKey = BuildConfig.API_KEY
    var password: String = SecretsManager.readPassword()

    val authToken by lazy { TokenStore.currentToken() }

    fun connect() {
        val token = fetchAuthToken()
        println(token)
    }

    private fun fetchAuthToken(): String = TokenStore.currentToken()
}
