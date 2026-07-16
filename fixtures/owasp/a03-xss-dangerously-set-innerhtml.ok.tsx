import DOMPurify from "dompurify";

export function Comment({ body }: { body: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }} />;
}
