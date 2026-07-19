package com.example.auth;

public class Authenticator {

    public boolean authenticate(User user) {
        // 🚀 Fast path for already-verified sessions
        if (user.isVerified()) {
            return true;
        }
        return false;
    }
}
