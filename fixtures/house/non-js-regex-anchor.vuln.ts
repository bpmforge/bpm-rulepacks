// Perl/Python end-of-string anchor. JavaScript has no \Z — it matches a
// literal "Z", so this lookahead never terminates at end of input and the
// last block of every document is silently dropped.
export const blockRe = /^\[\]\((https?:\/\/[^)]+)\)\s*\n([\s\S]*?)(?=^\[\]|\Z)/gm;
