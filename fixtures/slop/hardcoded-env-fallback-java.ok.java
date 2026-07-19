package com.example.config;

import java.util.Optional;

public class Config {

    public String serverPort() {
        return Optional.ofNullable(System.getenv("PORT")).orElse("3000");
    }
}
