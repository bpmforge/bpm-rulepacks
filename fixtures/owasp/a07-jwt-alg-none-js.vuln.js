import jwt from "jsonwebtoken";

export function verifyToken(token) {
  return jwt.verify(token, "any-secret", { algorithms: ["none"] });
}
