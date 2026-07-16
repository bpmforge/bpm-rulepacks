import jwt from "jsonwebtoken";

export function issueToken(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}
