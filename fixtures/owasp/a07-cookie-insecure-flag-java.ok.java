package com.example.web;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

public class SessionCookieWriter {

    public void writeSessionCookie(HttpServletResponse response, String sessionId) {
        Cookie cookie = new Cookie("JSESSIONID", sessionId);
        cookie.setSecure(true);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }
}
