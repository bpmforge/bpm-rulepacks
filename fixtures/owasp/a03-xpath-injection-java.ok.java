package com.example.employees;

import javax.servlet.http.HttpServletRequest;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathVariableResolver;
import javax.xml.namespace.QName;
import org.w3c.dom.Document;

public class EmployeeLookupServlet {

    public String lookup(HttpServletRequest request, XPath xp, Document doc) throws Exception {
        // Bind the tainted value as an XPath variable instead of concatenating it
        // into the expression string.
        String employeeId = request.getParameter("employeeId");
        xp.setXPathVariableResolver(
                new XPathVariableResolver() {
                    @Override
                    public Object resolveVariable(QName variableName) {
                        return employeeId;
                    }
                });
        String expression = "/employees/employee[@id=$empId]/name";
        return xp.evaluate(expression, doc);
    }
}
