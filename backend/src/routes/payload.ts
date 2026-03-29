import { FastifyInstance } from 'fastify';
import { pingRepo } from '../db/index.js';

export default async function payloadRoutes(fastify: FastifyInstance) {
  fastify.get('/:pingId', async (request: any, reply: any) => {
    const { pingId } = request.params as { pingId: string };
    const result = await pingRepo.findPayloadById(pingId);

    if (!result || !result.payload) {
      return reply.status(404).send('Payload Not Found');
    }

    reply.header('Content-Type', result.mimeType || 'application/octet-stream');
    reply.header('Content-Security-Policy', "default-src 'none'");
    reply.header('X-Content-Type-Options', 'nosniff');
    return reply.send(result.payload);
  });
}
