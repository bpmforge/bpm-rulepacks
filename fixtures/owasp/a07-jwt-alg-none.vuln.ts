import jwt from "jsonwebtoken";

export function verifyToken(token: string) {
  return jwt.verify(token, "any-secret", { algorithms: ["none"] });
}
