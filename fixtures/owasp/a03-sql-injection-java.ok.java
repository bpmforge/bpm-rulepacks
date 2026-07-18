package com.example.web;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import javax.servlet.http.HttpServletRequest;

public class AccountServlet {

    public void lookup(HttpServletRequest request, Connection connection) throws Exception {
        String accountId = request.getParameter("accountId");
        PreparedStatement statement =
                connection.prepareStatement("SELECT balance FROM accounts WHERE id = ?");
        statement.setString(1, accountId);
        ResultSet rs = statement.executeQuery();
    }
}
