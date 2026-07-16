import { sql } from "drizzle-orm";

export async function searchUsers(db: DrizzleDb, nameFilter: string) {
  const condition = sql.raw(`name = '${nameFilter}'`);
  return db.select().from(users).where(condition);
}
