import crypto from "crypto";

export function hashPassword(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}
