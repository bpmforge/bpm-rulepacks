package com.example.api;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class AccountController {

    @GetMapping("/api/account")
    public Object getAccount() {
        return null;
    }
}
