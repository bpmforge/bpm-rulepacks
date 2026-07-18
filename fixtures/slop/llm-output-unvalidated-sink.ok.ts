async function runQuery(prompt: string) {
  const result = await llm.generate(prompt);
  const validated = querySchema.parse(result);
  db.execute(validated.sql, validated.params);
}
