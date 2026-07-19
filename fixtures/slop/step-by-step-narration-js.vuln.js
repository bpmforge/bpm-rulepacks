function processOrder(order) {
  // Step 1: validate the order
  validate(order);
  // Step 2: charge the customer
  charge(order);
}
