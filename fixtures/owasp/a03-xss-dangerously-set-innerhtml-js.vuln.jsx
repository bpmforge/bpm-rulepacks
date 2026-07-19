export function Comment({ body }) {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
