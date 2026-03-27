import { FastifyInstance } from 'fastify';
import { checkRepo, pingRepo } from '../db/index.js';
import crypto from 'crypto';

export default async function pingRoutes(fastify: FastifyInstance) {
  // Common handler for both GET and POST requests to /ping/:uuid
  const handlePing = async (request: any, reply: any) => {
    const { uuid } = request.params as { uuid: string };

    const check = await checkRepo.findById(uuid);
    if (!check) {
      return reply.status(404).send('Not Found');
    }

    const now = new Date().toISOString();

    // Log the ping
    await pingRepo.insert({
      id: crypto.randomUUID(),
      checkId: uuid,
      remoteIp: request.ip || null,
      userAgent: request.headers['user-agent'] || null,
      scheme: request.protocol,
      method: request.method,
      createdAt: now
    });

    // Update the check status
    await checkRepo.update(uuid, {
      lastPing: now,
      status: 'UP'
    });

    return reply.send('OK');
  };

  fastify.get('/:uuid', handlePing);
  fastify.post('/:uuid', handlePing);
}
