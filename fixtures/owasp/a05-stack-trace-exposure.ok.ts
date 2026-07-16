export function errorHandler(err, req, res, next) {
  logger.error("request failed", { err, path: req.path });
  res.status(500).json({ error: "Internal server error" });
}
