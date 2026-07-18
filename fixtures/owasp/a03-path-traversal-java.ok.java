package com.example.web;

import java.io.File;
import java.io.FileInputStream;
import javax.servlet.http.HttpServletRequest;

public class DownloadServlet {

    private static final File BASE_DIR = new File("/var/app/uploads/");

    public FileInputStream open(HttpServletRequest request) throws Exception {
        // Allowlist branch: the request only ever selects which fixed literal is
        // used; the request value itself never becomes part of the path.
        String fileKey = request.getParameter("file");
        String safeName;
        if ("license".equals(fileKey)) {
            safeName = "license.txt";
        } else {
            safeName = "readme.txt";
        }
        File target = new File(BASE_DIR, safeName);
        return new FileInputStream(target);
    }
}
