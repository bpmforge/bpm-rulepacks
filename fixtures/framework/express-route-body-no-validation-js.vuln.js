const express = require("express");
const router = express.Router();
const orderService = require("../services/orderService");

// No schema, no zod/joi parse, no express-validator middleware anywhere in
// this handler or its registration -- the raw body reaches orderService
// unchecked. Different variable names and a different service than the
// sampleco defect this rule targets, to avoid pinning the literal text.
router.post("/orders", requireAuth, (request, response) => {
  orderService.createOrder(request.body, (err) =>
    response.json({ created: !err }),
  );
});

// Same unvalidated shape but the modern async/await, no-callback form (one
// argument, not two) -- the dominant style in current Express code. An
// earlier draft of this rule used a single blanket "any 1-arg call on
// req.body counts as validated" not-inside clause, which self-collided with
// exactly this shape and silently stopped firing on it.
router.put("/orders/:id", requireAuth, async (request, response) => {
  const updated = await orderService.updateOrder(request.body);
  response.json(updated);
});

module.exports = router;
