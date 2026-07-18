package com.example.directory;

import javax.naming.directory.DirContext;
import javax.servlet.http.HttpServletRequest;

public class UserLookupServlet {

    public void lookup(HttpServletRequest request, DirContext ctx) throws Exception {
        // Parameterized filter: the tainted value is passed as a bind argument to
        // the JNDI filter-args form, never concatenated into the filter string.
        String uid = request.getParameter("uid");
        String filterExpr = "(&(objectClass=person)(uid={0}))";
        Object[] filterArgs = new Object[] {uid};
        ctx.search("ou=users,dc=example,dc=com", filterExpr, filterArgs, null);
    }
}
