// Prepared once, reused per row — the whole point of a prepared statement.
export function indexAll(db: any, files: string[]): void {
  const stmt = db.prepare("INSERT INTO files (path) VALUES (?)");
  for (const f of files) {
    stmt.run(f);
  }
}

// A single prepare outside any loop must stay clean.
export function indexOne(db: any, file: string): void {
  db.prepare("INSERT INTO files (path) VALUES (?)").run(file);
}
