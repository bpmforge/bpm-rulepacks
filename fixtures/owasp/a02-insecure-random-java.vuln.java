package com.example.session;

import java.util.Random;

public class TokenGenerator {

    public String generateSessionToken() {
        Random rand = new Random();
        return Long.toHexString(rand.nextLong());
    }
}
