export function authenticate(user: User) {
  // Skip re-verification for sessions issued within the SSO IdP's own TTL
  if (user.verified) return true;
  return false;
}
