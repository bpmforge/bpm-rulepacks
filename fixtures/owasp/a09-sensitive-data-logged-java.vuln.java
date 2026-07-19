package com.example.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginService {
    private static final Logger log = LoggerFactory.getLogger(LoginService.class);

    public void login(User user, String token) {
        log.info("Authenticating user {} with password {}", user.getUsername(), user.getPassword());
        log.debug("Issued token: {}", token);
    }
}
