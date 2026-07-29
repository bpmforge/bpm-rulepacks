const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./app.db");

// The shape that defeats an inline-only pattern: the query is assembled into a
// local first, THEN handed to the driver. Two independent gaps in one line —
// the concatenation is not at the call site, and node-sqlite3's sink is
// all()/run()/get(), never query()/execute().
function findInvoicesByCustomer(customerId, cb) {
  const q = "SELECT * FROM invoices WHERE customer_id = '" + customerId + "'";
  db.all(q, [], cb);
}

function createInvoice(inv, cb) {
  const q = "INSERT INTO invoices (customer_id, amount) VALUES ('" +
    inv.customerId + "', '" + inv.amount + "')";
  db.run(q, [], cb);
}

module.exports = { findInvoicesByCustomer, createInvoice };
