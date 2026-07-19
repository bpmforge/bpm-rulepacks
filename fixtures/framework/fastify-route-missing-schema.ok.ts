import type { FastifyInstance } from "fastify";

export function registerUserRoutes(fastify: FastifyInstance) {
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
// app.get/router.get false-positive — the receiver is `app`, not `fastify`).
import type { Express, Router } from "express";

export function registerExpressRoutes(app: Express, router: Router) {
  app.get("/users", (req, res) => {
    res.json({ status: "ok" });
  });
  router.post("/users", (req, res) => {
    res.json({ status: "created" });
  });
}
