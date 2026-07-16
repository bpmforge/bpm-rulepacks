export function processOrder(order: Order, user: User) {
  validate(order);
  const perms = fetchPermissions(user);
  return applyDiscount(order, perms);
}
