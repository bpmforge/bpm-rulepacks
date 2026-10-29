export async function getUser(db, userId: string) {
  return db.query("SELECT * FROM users WHERE id = $1", [userId]);
}

// RegExp.prototype.exec is not a database call, and a template built only
// from the class's own fields (an internally generated working-table name)
// carries no input. 12 of 12 outline hits were one of these two shapes.
export function docPath(path: string) {
  const match = /^\/doc\/([^/?#]+)(.*)$/.exec(`${path}`);
  return UrlHelper.SLUG_URL_REGEX.exec(`${match?.[1]}`);
}

export class PopularityTask {
  private workingTable = "popularity_working";
  async count(sequelize: Sequelize) {
    await sequelize.query(`SELECT count(*) FROM ${this.workingTable} WHERE NOT processed`);
  }
}
