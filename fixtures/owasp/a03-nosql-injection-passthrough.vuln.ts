export async function search(req, res) {
  const results = await User.find(req.query);
  res.json(results);
}
