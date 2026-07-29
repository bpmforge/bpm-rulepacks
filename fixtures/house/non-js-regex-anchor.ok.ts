// The JavaScript spelling: `$` with the `m` flag, and a native named group.
export const blockRe = /^\[\]\((?<url>https?:\/\/[^)]+)\)\s*\n([\s\S]*?)(?=^\[\]|$)/gm;

// A capital Z that is a LITERAL character, not an escape, must stay clean —
// this is the boundary the rule must not cross.
export const zoneRe = /^Zone-[A-Z]+$/;

// A backslash-Z inside an ordinary string is not a regex anchor.
export const notARegex = "C:\\Zips\\archive";
