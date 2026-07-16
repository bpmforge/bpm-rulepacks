import React from "react";
import { isSafeUrl } from "../lib/url-safety";

interface ProfileLinkProps {
  profileUrl: string;
}

export function ProfileLink({ profileUrl }: ProfileLinkProps) {
  return <a href={isSafeUrl(profileUrl)}>Visit profile</a>;
}

export function DocsLink() {
  return <a href="https://docs.example.com">Docs</a>;
}

export function EmbeddedWidget() {
  return <iframe src="https://widgets.example.com/embed" />;
}
