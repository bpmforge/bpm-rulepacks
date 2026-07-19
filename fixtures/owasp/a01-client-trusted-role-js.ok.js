export function deleteUser(req, res) {
  if (req.session.user.role === "admin") {
    db.users.delete(req.params.id);
  }
  res.sendStatus(204);
}
