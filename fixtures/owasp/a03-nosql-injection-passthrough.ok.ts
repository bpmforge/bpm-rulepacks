export async function search(req, res) {
  const results = await User.find({ name: String(req.query.name) });
  res.json(results);
}
