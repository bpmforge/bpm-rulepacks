export function handleLogin(req, res) {
  logger.info(`login attempt for user=${req.body.username}`);
  res.sendStatus(200);
}
