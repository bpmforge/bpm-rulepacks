const express = require("express");
const router = express.Router();
const invoiceService = require("../services/invoiceService");
const { verifyToken } = require("../services/authService");

// Generic authentication only — proves who the caller is, says nothing
// about whether they're allowed to reach an admin capability.
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const result = verifyToken(token);
  if (!result.ok) return res.status(401).json({ error: "unauthorized" });
  req.user = result;
  next();
}

// Any authenticated user — not just an admin — can list every customer's
// invoices. req.user.role is set by requireAuth but never compared to
// anything before the handler reaches the data.
router.get("/invoices", requireAuth, (req, res) => {
  invoiceService.findInvoicesByCustomer(
    req.query.customerId || "1",
    (e, rows) => res.json(rows || []),
  );
});

module.exports = router;
