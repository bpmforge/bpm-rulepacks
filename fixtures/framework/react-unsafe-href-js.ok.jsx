import React from "react";
import { isSafeUrl } from "../lib/url-safety";

export function ProfileLink({ profileUrl }) {
  return <a href={isSafeUrl(profileUrl)}>Visit profile</a>;
}

export function DocsLink() {
  return <a href="https://docs.example.com">Docs</a>;
}

export function EmbeddedWidget() {
  return <iframe src="https://widgets.example.com/embed" />;
}
