export async function findUserById(db: DrizzleDb, userId: string) {
  return db.execute(`SELECT * FROM users WHERE id = ${userId}`);
}
