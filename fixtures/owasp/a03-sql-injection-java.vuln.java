package com.example.web;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.servlet.http.HttpServletRequest;

public class AccountServlet {

    public void lookup(HttpServletRequest request, Connection connection) throws Exception {
        String accountId = request.getParameter("accountId");
        String sql = "SELECT balance FROM accounts WHERE id = " + accountId;
        Statement statement = connection.createStatement();
        ResultSet rs = statement.executeQuery(sql);
    }
}
