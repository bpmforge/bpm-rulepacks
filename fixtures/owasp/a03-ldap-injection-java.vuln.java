package com.example.directory;

import javax.naming.directory.DirContext;
import javax.servlet.http.HttpServletRequest;

public class UserLookupServlet {

    public void lookup(HttpServletRequest request, DirContext ctx) throws Exception {
        String uid = request.getParameter("uid");
        String filter = "(&(objectClass=person)(uid=" + uid + "))";
        ctx.search("ou=users,dc=example,dc=com", filter, null);
    }
}
