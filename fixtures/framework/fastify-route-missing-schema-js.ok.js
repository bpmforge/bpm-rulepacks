export function registerUserRoutes(fastify) {
  fastify.post(
    "/users",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } },
        },
      },
    },
    async (req, reply) => {
      await db.createUser(req.body);
      reply.send({ status: "created" });
    },
  );
}

// Express, not Fastify: no `schema` concept exists on Express routes, so
// this must NOT be flagged by a Fastify-specific rule (regression for the
// app.get/router.get false-positive -- the receiver is `app`, not `fastify`).
export function registerExpressRoutes(app, router) {
  app.get("/users", (req, res) => {
    res.json({ status: "ok" });
  });
  router.post("/users", (req, res) => {
    res.json({ status: "created" });
  });
}

// 3-arg Express form (route, middleware, handler) -- regression for the
// -3arg Fastify rule, which used the same unconstrained $APP receiver.
// authMiddleware is not `{ ..., schema: $S, ... }`, so absent the
// `^fastify$` guard this would have false-fired as a "missing schema".
function authMiddleware(req, res, next) {
  next();
}

export function registerExpressAdminRoutes(app) {
  app.get("/admin", authMiddleware, (req, res) => {
    res.json({ status: "ok" });
  });
}
