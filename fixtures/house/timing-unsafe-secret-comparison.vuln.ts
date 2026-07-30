// Short-circuiting comparison of a bearer token: how long it takes leaks how
// many leading bytes were correct, on a route an attacker can hit repeatedly.
export function checkAuth(token: string, opts: { token: string }): boolean {
  if (token !== opts.token) {
    return false;
  }
  return true;
}
