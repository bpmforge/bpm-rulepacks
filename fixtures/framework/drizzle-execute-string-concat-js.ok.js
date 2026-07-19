import { sql } from "drizzle-orm";

export async function findUserById(db, userId) {
  return db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
}
