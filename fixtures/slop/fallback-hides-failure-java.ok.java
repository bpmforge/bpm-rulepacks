package com.example.users;

public class UserPreferences {

    public String fetchTheme(String userId) throws PreferenceFetchException {
        try {
            return preferenceClient.fetchTheme(userId);
        } catch (Exception e) {
            throw new PreferenceFetchException("theme fetch failed for " + userId, e);
        }
    }
}
