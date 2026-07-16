import type { FastifyInstance } from "fastify";
import sanitizeHtml from "sanitize-html";

export function registerEchoRoute(fastify: FastifyInstance) {
  fastify.post("/echo", async (req, reply) => {
    const message = req.body.message;
    const clean = sanitizeHtml.sanitize(message);
    reply.send(clean);
  });
}
