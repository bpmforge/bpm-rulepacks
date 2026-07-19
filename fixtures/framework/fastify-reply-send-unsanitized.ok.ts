import type { FastifyInstance } from "fastify";
import sanitizeHtml from "sanitize-html";

export function registerEchoRoute(fastify: FastifyInstance) {
  fastify.post(
    "/echo",
    { schema: { body: { type: "object" } } },
    async (req, reply) => {
      const message = req.body.message;
      const clean = sanitizeHtml.sanitize(message);
      reply.send(clean);
    },
  );
}
