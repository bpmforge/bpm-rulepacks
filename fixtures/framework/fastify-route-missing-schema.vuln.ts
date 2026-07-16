import type { FastifyInstance } from "fastify";

export function registerUserRoutes(fastify: FastifyInstance) {
  fastify.post("/users", async (req, reply) => {
    const user = await db.createUser(req.body);
    reply.send(user);
  });
}
