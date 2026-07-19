export function generateResetToken() {
  return Math.random().toString(36).slice(2);
}
