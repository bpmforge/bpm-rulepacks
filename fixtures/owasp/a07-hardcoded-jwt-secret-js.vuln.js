import jwt from "jsonwebtoken";

export function issueToken(payload) {
  return jwt.sign(payload, "super-secret-key-2024");
}
