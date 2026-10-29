import React from "react";

export function ExternalLink() {
  return (
    <a
      href="https://partner.example.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit partner site
    </a>
  );
}

// noreferrer implies noopener (HTML spec), and the rel may hold more tokens
// or sit on another line. 10 of 11 outline hits had one of these.
export function DocsLinks() {
  return (
    <>
      <a href="https://example.com/developers" target="_blank" rel="noreferrer">
        Developers
      </a>
      <a
        href="https://example.com/mention"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        Mention
      </a>
    </>
  );
}
