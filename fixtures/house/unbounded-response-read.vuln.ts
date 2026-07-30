// The whole response body is buffered with no size guard: a hostile or merely
// large endpoint decides how much memory this process allocates.
export async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url);
  const html = await res.text();
  return html;
}
