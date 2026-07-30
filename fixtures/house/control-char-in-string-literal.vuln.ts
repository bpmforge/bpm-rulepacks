// The join delimiter below is a raw SOH (0x01) byte. It renders as an empty
// string in every editor and diff, and the hash it feeds depends on it being
// there. Generated programmatically — see scratchpad/gen-ctrl-fixture.mjs.
export function joinTokens(toks: string[]): string {
  return toks.join("");
}
