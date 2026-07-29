const express = require("express");
const router = express.Router();
const orderService = require("../services/orderService");
const orderSchema = require("../schemas/orderSchema");
const { body, validationResult } = require("express-validator");

// Boundary case 1: same shape as the vuln fixture (raw body forwarded to a
// service), but a zod-style schema.parse(request.body) runs first in the
// same handler. This is the pattern the rule must NOT flag -- it differs
// from the vuln fixture only in the presence of validation, not in
// anything incidental.
router.post("/orders", requireAuth, (request, response) => {
  const parsed = orderSchema.parse(request.body);
  orderService.createOrder(parsed, (err) => response.json({ created: !err }));
});

// Boundary case 2: validation via an express-validator middleware chain
// (the other dominant real-world Express pattern) instead of an inline
// schema call.
router.post(
  "/orders/:id/items",
  requireAuth,
  body("sku").notEmpty(),
  (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    orderService.addItem(request.body, (err) => response.json({ added: !err }));
  },
);

module.exports = router;
