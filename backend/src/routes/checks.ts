import { FastifyInstance } from 'fastify';
import { checkRepo, pingRepo } from '../db/index.js';
import { CreateCheckSchema, UpdateCheckSchema } from '@healthchecks/shared';
import crypto from 'crypto';

export default async function checkRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const userId = (request as any).user.id;
    const checks = await checkRepo.findAll(userId);
    return reply.send(checks);
  });

  fastify.get('/:id', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    const check = await checkRepo.findById(id, userId);
    if (!check) return reply.status(404).send({ error: 'Check not found' });
    return reply.send(check);
  });

  fastify.get('/:id/pings', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    const check = await checkRepo.findById(id, userId);
    if (!check) return reply.status(404).send({ error: 'Check not found' });

    const pings = await pingRepo.findByCheckId(id, 50);
    return reply.send(pings);
  });

  fastify.post('/', async (request, reply) => {
    const userId = (request as any).user.id;
    const parseRes = CreateCheckSchema.safeParse(request.body);
    if (!parseRes.success) return reply.status(400).send({ error: parseRes.error.issues });

    const data = parseRes.data;
    const newCheck = {
      id: crypto.randomUUID(),
      userId,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: data.description || null,
      tags: data.tags || undefined,
      intervalSeconds: data.intervalSeconds,
      graceSeconds: data.graceSeconds,
      status: 'NEW' as const,
      lastPing: null,
      createdAt: new Date().toISOString()
    };

    await checkRepo.insert(newCheck);
    return reply.send(newCheck);
  });

  fastify.put('/:id', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    const parseRes = UpdateCheckSchema.safeParse(request.body);
    if (!parseRes.success) return reply.status(400).send({ error: parseRes.error.issues });

    await checkRepo.update(id, userId, parseRes.data);
    const updated = await checkRepo.findById(id, userId);
    return reply.send(updated);
  });

  fastify.delete('/:id', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    await checkRepo.delete(id, userId);
    return reply.send({ success: true });
  });
}
