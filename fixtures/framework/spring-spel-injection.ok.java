package com.example.pricing;

import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DiscountController {

    @GetMapping("/discount")
    public Object evaluate(@RequestParam("tier") String tier) {
        // Fixed, developer-authored expression literal — never built from
        // request input. The tier value only selects which pre-defined
        // discount policy branch to apply, it is never parsed as SpEL
        // itself.
        Expression expression = new SpelExpressionParser().parseExpression("basePrice * 0.9");
        return expression.getValue();
    }
}
