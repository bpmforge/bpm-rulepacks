export const seedAdmin = { username: "admin", password: "admin" };

export async function ensureAdmin(db) {
  await db.users.insertOne(seedAdmin);
}
