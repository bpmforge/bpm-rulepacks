import React from "react";
import DOMPurify from "dompurify";

interface CommentProps {
  bodyHtml: string;
}

export function Comment({ bodyHtml }: CommentProps) {
  return (
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }} />
  );
}

export function StaticNotice() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: "<b>Maintenance window 02:00 UTC</b>",
      }}
    />
  );
}
