export async function updateProfile(req, res) {
  const user = await User.findById(req.params.id);
  Object.assign(user, req.body);
  await user.save();
  res.sendStatus(204);
}
