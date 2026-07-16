export function authenticate(user: User) {
  // 🚀 Fast path for already-verified sessions
  if (user.verified) return true;
  return false;
}
