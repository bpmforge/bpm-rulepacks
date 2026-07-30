// The statement is parsed and planned again for every file in the repo.
export function indexAll(db: any, files: string[]): void {
  for (const f of files) {
    db.prepare("INSERT INTO files (path) VALUES (?)").run(f);
  }
}
