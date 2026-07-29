const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./app.db");

// Same driver, same sinks, same via-a-local structure — parameterized.
// This pins the boundary: it is the CONCATENATION that is the defect, not
// the use of a local variable or of db.all/db.run.
function findInvoicesByCustomer(customerId, cb) {
  const q = "SELECT * FROM invoices WHERE customer_id = ?";
  db.all(q, [customerId], cb);
}

function createInvoice(inv, cb) {
  const q = "INSERT INTO invoices (customer_id, amount) VALUES (?, ?)";
  db.run(q, [inv.customerId, inv.amount], cb);
}

// A concatenated string that is not SQL and never reaches a DB sink must
// also stay clean.
function buildLogLine(userId) {
  const line = "user id = " + userId;
  console.log(line);
}

module.exports = { findInvoicesByCustomer, createInvoice, buildLogLine };
