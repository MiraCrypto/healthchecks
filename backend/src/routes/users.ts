import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepo } from '../db/DatabaseFactory.js';
import { UpdateProfileSchema, ChangePasswordSchema, AdminCreateUserSchema, AdminUpdateRoleSchema } from '@healthchecks/shared';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

// We'll expose raw DB instances via userRepo to make custom queries if needed,
// but for simplicity we'll just add the necessary methods to userRepo.

export default async function userRoutes(fastify: FastifyInstance) {

  // Public Profile
  fastify.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await userRepo.findByUsername(username);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return reply.send({
      username: user.username,
      displayName: user.displayName,
      description: user.description,
      createdAt: user.createdAt
    });
  });

  // Update Profile
  fastify.put('/me', async (request, reply) => {
    const userToken = request.user!;
    const parseRes = UpdateProfileSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    await userRepo.update(userToken.id, parseRes.data);
    return reply.send({ message: 'Profile updated' });
  });

  // Change Password
  fastify.put('/me/password', async (request, reply) => {
    const userToken = request.user!;
    const parseRes = ChangePasswordSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const { currentPassword, newPassword } = parseRes.data;

    const user = await userRepo.findById(userToken.id);
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return reply.status(401).send({ error: 'Incorrect current password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepo.update(userToken.id, { passwordHash });

    return reply.send({ message: 'Password updated' });
  });

  // Admin Routes
  fastify.get('/', async (request, reply) => {
    const userToken = request.user!;
    if (userToken.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    const users = await userRepo.findAll();
    return reply.send(users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      displayName: u.displayName,
      description: u.description,
      createdAt: u.createdAt
    })));
  });

  fastify.post('/', async (request, reply) => {
    const userToken = request.user!;
    if (userToken.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const parseRes = AdminCreateUserSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const { username, password, role } = parseRes.data;

    const existing = await userRepo.findByUsername(username);
    if (existing) {
      return reply.status(400).send({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      role,
      displayName: null,
      description: null,
      createdAt: new Date().toISOString()
    };

    await userRepo.insert(newUser);
    return reply.send({ message: 'User created successfully', user: { id: newUser.id, username, role } });
  });

  fastify.put('/:id/role', async (request, reply) => {
    const userToken = request.user!;
    if (userToken.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { id } = request.params as { id: string };
    if (!uuidSchema.safeParse(id).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for id' });
    }
    const parseRes = AdminUpdateRoleSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const userToUpdate = await userRepo.findById(id);
    if (!userToUpdate) {
      return reply.status(404).send({ error: 'User not found' });
    }

    await userRepo.update(id, { role: parseRes.data.role });
    return reply.send({ message: 'User role updated' });
  });

}
