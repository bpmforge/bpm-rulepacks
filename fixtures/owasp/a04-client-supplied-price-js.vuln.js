export async function checkout(req, res) {
  const charge = await stripe.charges.create({
    amount: req.body.amount,
    currency: "usd",
    source: req.body.source,
  });
  res.json(charge);
}
