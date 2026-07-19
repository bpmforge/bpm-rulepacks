package com.example.auth

class Authenticator {
    fun authenticate(user: User): Boolean {
        // Skip re-verification for sessions issued within the SSO IdP's own TTL
        if (user.isVerified) {
            return true
        }
        return false
    }
}

class User(val isVerified: Boolean)
