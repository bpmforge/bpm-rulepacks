export function load() {
  try { risky(); } catch (e) { }
}

// A comment that defers the handling is not a reason; this still fires.
export async function follow(account: Account) {
  try {
    await api.follow(account);
  } catch (_err) {
    // TODO: handle error
  }
}
