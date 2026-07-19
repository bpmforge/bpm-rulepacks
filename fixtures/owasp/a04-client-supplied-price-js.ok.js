export async function checkout(req, res) {
  const order = await Order.findById(req.body.orderId);
  const charge = await stripe.charges.create({
    amount: order.totalCents,
    currency: "usd",
    source: req.body.source,
  });
  res.json(charge);
}
