func processOrder(order: Order, user: User) -> Order {
    // Step 1: Validate the input parameters
    validate(order)
    // Step 2: Fetch the user's permissions
    let perms = fetchPermissions(user)
    // Step 3: Apply the discount
    return applyDiscount(order, perms)
}
