package com.example.auth

class Authenticator {
    fun authenticate(user: User): Boolean {
        // 🚀 Fast path for already-verified sessions
        if (user.isVerified) {
            return true
        }
        return false
    }
}

class User(val isVerified: Boolean)
