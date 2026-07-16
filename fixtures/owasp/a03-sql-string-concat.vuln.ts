export async function getUser(db, userId: string) {
  return db.query(`SELECT * FROM users WHERE id = ${userId}`);
}
