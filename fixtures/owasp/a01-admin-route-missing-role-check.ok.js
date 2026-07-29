const express = require("express");
const router = express.Router();
const invoiceService = require("../services/invoiceService");
const { verifyToken } = require("../services/authService");

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const result = verifyToken(token);
  if (!result.ok) return res.status(401).json({ error: "unauthorized" });
  req.user = result;
  next();
}

// Same driver, same middleware, same sink — the only difference from the
// .vuln fixture is that the authenticated user's role is actually checked
// before the handler reaches other customers' data. This pins the boundary
// as "role check present/absent", not "uses requireAuth" or "lives in an
// admin file".
router.get("/invoices", requireAuth, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  invoiceService.findInvoicesByCustomer(
    req.query.customerId || "1",
    (e, rows) => res.json(rows || []),
  );
});

module.exports = router;
