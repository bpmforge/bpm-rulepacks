import type { FastifyInstance } from "fastify";

export function registerEchoRoute(fastify: FastifyInstance) {
  fastify.post("/echo", async (req, reply) => {
    const message = req.body.message;
    reply.send(message);
  });
}
