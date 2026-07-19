import { sql } from "drizzle-orm";

export async function searchUsers(db, nameFilter) {
  const condition = sql.raw(`name = '${nameFilter}'`);
  return db.select().from(users).where(condition);
}
