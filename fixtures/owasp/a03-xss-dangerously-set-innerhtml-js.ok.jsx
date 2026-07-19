import DOMPurify from "dompurify";

export function Comment({ body }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }} />;
}
