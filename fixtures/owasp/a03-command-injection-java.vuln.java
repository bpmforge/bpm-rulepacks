package com.example.web;

import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;

public class PingServlet {

    public void ping(HttpServletRequest request) throws Exception {
        String host = request.getParameter("host");
        List<String> args = new ArrayList<>();
        args.add("sh");
        args.add("-c");
        args.add("ping -c 1 " + host);
        ProcessBuilder pb = new ProcessBuilder();
        pb.command(args);
        pb.start();
    }
}
