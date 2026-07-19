import React from "react";

export function ProfileLink({ profileUrl }) {
  // profileUrl comes from the user's own profile settings, editable by them.
  return <a href={profileUrl}>Visit profile</a>;
}

export function DebugFrame() {
  return <iframe src="javascript:alert(document.cookie)" />;
}
