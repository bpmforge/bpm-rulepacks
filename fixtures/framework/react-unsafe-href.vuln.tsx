import React from "react";

interface ProfileLinkProps {
  profileUrl: string;
}

export function ProfileLink({ profileUrl }: ProfileLinkProps) {
  // profileUrl comes from the user's own profile settings, editable by them.
  return <a href={profileUrl}>Visit profile</a>;
}

export function DebugFrame() {
  return <iframe src="javascript:alert(document.cookie)" />;
}
