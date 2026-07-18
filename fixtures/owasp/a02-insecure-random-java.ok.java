package com.example.session;

import java.security.SecureRandom;

public class TokenGenerator {

    public String generateSessionToken() {
        SecureRandom rand = new SecureRandom();
        return Long.toHexString(rand.nextLong());
    }
}
