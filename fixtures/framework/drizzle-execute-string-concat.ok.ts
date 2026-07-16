import { sql } from "drizzle-orm";

export async function findUserById(db: DrizzleDb, userId: string) {
  return db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
}
