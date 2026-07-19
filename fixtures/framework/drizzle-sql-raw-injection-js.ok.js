import { sql } from "drizzle-orm";

export async function searchUsers(db, nameFilter) {
  const condition = sql`name = ${nameFilter}`;
  return db.select().from(users).where(condition);
}

export async function sortUsers(db) {
  const direction = sql.raw("DESC");
  return db.select().from(users).orderBy(direction);
}
