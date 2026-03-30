import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepo } from '../db/DatabaseFactory.js';
import { LoginSchema } from '@healthchecks/shared';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const parseRes = LoginSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const { username, password } = parseRes.data;

    const existing = await userRepo.findByUsername(username);
    if (existing) {
      return reply.status(400).send({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Make the first user an admin
    const isFirstUser = await userRepo.count() === 0;
    const role: 'ADMIN' | 'USER' = isFirstUser ? 'ADMIN' : 'USER';

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

    const token = jwt.sign(
      { username, id: newUser.id, role },
      process.env.JWT_SECRET || 'supersecret123',
      { expiresIn: '7d' }
    );

    reply.setCookie('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return reply.send({ message: 'Registered successfully', user: { id: newUser.id, username } });
  });

  fastify.post('/login', async (request, reply) => {
    const parseRes = LoginSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const { username, password } = parseRes.data;

    const user = await userRepo.findByUsername(username);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username, id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecret123',
      { expiresIn: '7d' }
    );

    reply.setCookie('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return reply.send({ message: 'Logged in' });
  });

  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('auth_token', { path: '/' });
    return reply.send({ message: 'Logged out' });
  });

  fastify.get('/me', async (request, reply) => {
    const userToken = request.user;
    if (!userToken) return reply.status(401).send({ error: 'Unauthorized' });
    const user = await userRepo.findByUsername(userToken.username);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    return reply.send({
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      description: user.description,
      createdAt: user.createdAt
    });
  });
}
