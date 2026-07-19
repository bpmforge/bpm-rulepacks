package com.example.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginService {
    private static final Logger log = LoggerFactory.getLogger(LoginService.class);

    public void login(User user, String token) {
        // Log a non-reversible identifier instead of the raw credential.
        log.info("Authenticating user {}", user.getUsername());
        log.debug("Issued token for user {}", user.getUsername());
    }
}
