import Fastify, { FastifyInstance } from 'fastify';
// @ts-ignore
import cors from '@fastify/cors';
// @ts-ignore
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import checkRoutes from './routes/checks.js';
import pingRoutes from './routes/ping.js';
import * as dotenv from 'dotenv';
dotenv.config();

const fastify: FastifyInstance = Fastify({ logger: true });

async function buildServer() {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'fallback_cookie_secret_1234',
  });

  // Authentication Hook (Minimal JWT verify)
  fastify.decorateRequest('user', null);
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for ping routes
    if (request.url.startsWith('/ping')) return;

    // Skip auth for login/register
    if ((request.url === '/api/auth/login' || request.url === '/api/auth/register') && request.method === 'POST') return;

    try {
      const token = (request as any).cookies.auth_token;
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const secret = process.env.JWT_SECRET || 'supersecret123';
      const decoded = jwt.verify(token, secret);
      (request as any).user = decoded;
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid Token' });
    }
  });

  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(checkRoutes, { prefix: '/api/checks' });
  fastify.register(pingRoutes, { prefix: '/ping' });

  return fastify;
}

buildServer().then((app) => {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
  });
});
