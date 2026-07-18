package com.example.web;

import java.io.File;
import java.io.FileInputStream;
import javax.servlet.http.HttpServletRequest;

public class DownloadServlet {

    private static final String BASE_DIR = "/var/app/uploads/";

    public FileInputStream open(HttpServletRequest request) throws Exception {
        String fileName = request.getParameter("file");
        File target = new File(BASE_DIR + fileName);
        return new FileInputStream(target);
    }
}
