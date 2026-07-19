package com.example.users;

public class UserPreferences {

    public String fetchTheme(String userId) {
        try {
            return preferenceClient.fetchTheme(userId);
        } catch (Exception e) {
            return "";
        }
    }
}
