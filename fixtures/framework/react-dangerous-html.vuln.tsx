import React from "react";

interface CommentProps {
  bodyHtml: string;
}

export function Comment({ bodyHtml }: CommentProps) {
  // bodyHtml comes straight from the API response — a rich-text field
  // an attacker can populate with their own markup.
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
