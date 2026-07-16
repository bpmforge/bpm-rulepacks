import bcrypt from "bcrypt";

export async function login(user, req) {
  const match = await bcrypt.compare(req.body.password, user.password);
  return { ok: match };
}
