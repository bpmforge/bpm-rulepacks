func processOrder(order: Order, user: User) -> Order {
    validate(order)
    let perms = fetchPermissions(user)
    return applyDiscount(order, perms)
}
