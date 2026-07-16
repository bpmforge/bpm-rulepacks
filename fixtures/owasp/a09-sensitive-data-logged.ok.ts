export function auditLogin(user, req) {
  logger.info("login attempt", { userId: user.id, outcome: "success" });
}
