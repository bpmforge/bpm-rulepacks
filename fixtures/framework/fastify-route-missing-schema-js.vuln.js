export function registerUserRoutes(fastify) {
  fastify.post("/users", async (req, reply) => {
    const user = await db.createUser(req.body);
    reply.send(user);
  });
}
