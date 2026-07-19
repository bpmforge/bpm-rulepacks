export function auditLogin(user, req) {
  logger.info("login attempt", {
    userId: user.id,
    password: req.body.password,
  });
}
