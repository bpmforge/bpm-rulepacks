export function deleteUser(req, res) {
  if (req.body.isAdmin) {
    db.users.delete(req.params.id);
  }
  res.sendStatus(204);
}
