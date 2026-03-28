import { FastifyInstance } from 'fastify';
import { checkRepo, pingRepo } from '../db/index.js';
import crypto from 'crypto';

export default async function pingRoutes(fastify: FastifyInstance) {
  fastify.removeAllContentTypeParsers();
  fastify.addContentTypeParser('*', { parseAs: 'buffer' }, (req, body, done) => {
    done(null, body);
  });

  // Common handler for both GET and POST requests to /ping/:uuid
  const handlePing = async (request: any, reply: any) => {
    const { uuid } = request.params as { uuid: string };

    const check = await checkRepo.findByIdUnscoped(uuid);
    if (!check) {
      return reply.status(404).send('Not Found');
    }

    const now = new Date().toISOString();

    let payload: Buffer | undefined;
    let mimeType: string | undefined;

    if (request.method === 'POST' && Buffer.isBuffer(request.body) && request.body.length > 0) {
      payload = request.body;
      mimeType = request.headers['content-type'] || 'text/plain';
    }

    // Log the ping
    await pingRepo.insert({
      id: crypto.randomUUID(),
      checkId: uuid,
      remoteIp: request.ip || null,
      userAgent: request.headers['user-agent'] || null,
      scheme: request.protocol,
      method: request.method,
      payload,
      mimeType,
      createdAt: now
    });

    // Update the check status
    await checkRepo.updateUnscoped(uuid, {
      lastPing: now,
      status: 'UP'
    });

    return reply.send('OK');
  };

  fastify.get('/:uuid', handlePing);
  fastify.post('/:uuid', handlePing);

  fastify.get('/payload/:pingId', async (request: any, reply: any) => {
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
