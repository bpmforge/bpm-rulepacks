export function login(user, req) {
  if (user.password === req.body.password) {
    return { ok: true };
  }
  return { ok: false };
}
