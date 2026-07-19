package com.example.pricing;

import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DiscountController {

    @GetMapping("/discount")
    public Object evaluate(@RequestParam("formula") String formula) {
        SpelExpressionParser parser = new SpelExpressionParser();
        Expression expression = new SpelExpressionParser().parseExpression(formula);
        return expression.getValue();
    }
}
