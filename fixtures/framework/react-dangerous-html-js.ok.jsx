import React from "react";
import DOMPurify from "dompurify";

export function Comment({ bodyHtml }) {
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
