export function processOrder(order: Order, user: User) {
  // Step 1: Validate the input parameters
  validate(order);
  // Step 2: Fetch the user's permissions
  const perms = fetchPermissions(user);
  // Step 3: Apply the discount
  return applyDiscount(order, perms);
}
