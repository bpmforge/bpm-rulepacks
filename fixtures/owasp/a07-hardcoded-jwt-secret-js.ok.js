import jwt from "jsonwebtoken";

export function issueToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}
