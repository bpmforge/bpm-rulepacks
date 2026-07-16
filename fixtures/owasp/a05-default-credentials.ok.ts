import crypto from "crypto";

export async function ensureAdmin(db) {
  const password = process.env.ADMIN_SEED_PASSWORD ?? crypto.randomBytes(16).toString("hex");
  await db.users.insertOne({ username: "admin", password, mustResetPassword: true });
}
