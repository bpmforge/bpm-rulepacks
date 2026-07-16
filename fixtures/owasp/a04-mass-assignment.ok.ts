export async function updateProfile(req, res) {
  const user = await User.findById(req.params.id);
  user.displayName = String(req.body.displayName);
  user.bio = String(req.body.bio);
  await user.save();
  res.sendStatus(204);
}
