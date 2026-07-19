package com.example.orders;

public class OrderProcessor {

    public Order processOrder(Order order, User user) {
        // Step 1: Validate the input parameters
        validate(order);
        // Step 2: Fetch the user's permissions
        Permissions perms = fetchPermissions(user);
        // Step 3: Apply the discount
        return applyDiscount(order, perms);
    }
}
