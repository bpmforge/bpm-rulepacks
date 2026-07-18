package com.example.web;

import java.net.InetAddress;
import javax.servlet.http.HttpServletRequest;

public class PingServlet {

    public void ping(HttpServletRequest request) throws Exception {
        String host = request.getParameter("host");
        // Resolve and reachability-check via the JDK API instead of shelling out.
        InetAddress addr = InetAddress.getByName(host);
        boolean reachable = addr.isReachable(2000);
    }
}
