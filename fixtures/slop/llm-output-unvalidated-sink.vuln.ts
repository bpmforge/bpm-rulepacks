async function runQuery(prompt: string) {
  const result = await llm.generate(prompt);
  db.execute(result);
}
