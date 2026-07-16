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
      const user = await db.createUser(req.body);
      reply.send(user);
    },
  );
}
