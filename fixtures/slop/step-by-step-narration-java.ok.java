package com.example.orders;

public class OrderProcessor {

    public Order processOrder(Order order, User user) {
        validate(order);
        Permissions perms = fetchPermissions(user);
        return applyDiscount(order, perms);
    }
}
