export async function findUserById(db, userId) {
  return db.execute(`SELECT * FROM users WHERE id = ${userId}`);
}
