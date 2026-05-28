import type { FastifyInstance } from 'fastify'
import process from 'node:process'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import * as dotenv from 'dotenv'
import Fastify from 'fastify'
import jwt from 'jsonwebtoken'
import authRoutes from './routes/auth.js'
import checkRoutes from './routes/checks.js'
import payloadRoutes from './routes/payload.js'
import pingRoutes from './routes/ping.js'
import userRoutes from './routes/users.js'
import './types/fastify.js'

dotenv.config()

const fastify: FastifyInstance = Fastify({ logger: true })

async function buildServer() {
  const { FRONTEND_URL, COOKIE_SECRET } = process.env

  await fastify.register(cors, {
    origin: FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })

  await fastify.register(cookie, {
    secret: COOKIE_SECRET || 'fallback_cookie_secret_1234',
  })

  // Authentication Hook (Minimal JWT verify)
  fastify.decorateRequest('user', undefined)
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for ping routes and payloads
    if (request.url.startsWith('/ping') || request.url.startsWith('/payload'))
      return

    // Skip auth for login/register
    if ((request.url === '/api/auth/login' || request.url === '/api/auth/register') && request.method === 'POST')
      return

    try {
      const { JWT_SECRET } = process.env
      const { auth_token: token } = request.cookies
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
      const secret = JWT_SECRET || 'supersecret123'
      const decoded = jwt.verify(token, secret) as { id: string, username: string, role: 'USER' | 'ADMIN' }
      request.user = decoded
      return
    }
    catch {
      return reply.status(401).send({ error: 'Invalid Token' })
    }
  })

  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(checkRoutes, { prefix: '/api/checks' })
  fastify.register(payloadRoutes, { prefix: '/payload' })
  fastify.register(pingRoutes, { prefix: '/ping' })
  fastify.register(userRoutes, { prefix: '/api/users' })

  return fastify
}

buildServer().then((app) => {
  const { PORT } = process.env
  const portNum = Number.parseInt(PORT || '8080', 10)
  app.listen({ port: portNum, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`Server listening at ${address}`)
  })
})
