import bcrypt from "bcrypt";

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
