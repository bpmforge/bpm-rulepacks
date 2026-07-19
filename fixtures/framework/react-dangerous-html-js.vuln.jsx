import React from "react";

export function Comment({ bodyHtml }) {
  // bodyHtml comes straight from the API response — a rich-text field
  // an attacker can populate with their own markup.
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
