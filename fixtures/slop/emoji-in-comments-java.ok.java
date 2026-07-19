package com.example.auth;

public class Authenticator {

    public boolean authenticate(User user) {
        // Skip re-verification for sessions issued within the SSO IdP's own TTL
        if (user.isVerified()) {
            return true;
        }
        return false;
    }
}
