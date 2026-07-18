package com.example.employees;

import javax.servlet.http.HttpServletRequest;
import javax.xml.xpath.XPath;
import org.w3c.dom.Document;

public class EmployeeLookupServlet {

    public String lookup(HttpServletRequest request, XPath xp, Document doc) throws Exception {
        String employeeId = request.getParameter("employeeId");
        String expression = "/employees/employee[@id='" + employeeId + "']/name";
        return xp.evaluate(expression, doc);
    }
}
