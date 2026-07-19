function processOrder(order) {
  // Charges only fire after validation succeeds.
  validate(order);
  charge(order);
}
