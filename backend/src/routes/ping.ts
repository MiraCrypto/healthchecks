import type { Ping } from '@healthchecks/shared'
import type { FastifyInstance } from 'fastify'
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { z } from 'zod'
import { checkRepo, pingRepo } from '../db/DatabaseFactory.js'

const uuidSchema = z.string().uuid()

export default async function pingRoutes(fastify: FastifyInstance) {
  fastify.removeAllContentTypeParsers()
  fastify.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body)
  })

  // Common handler for both GET and POST requests to /ping/:uuid
  const handlePing = async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    const { uuid } = request.params as { uuid: string }

    if (!uuidSchema.safeParse(uuid).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for check' })
    }

    const check = await checkRepo.findByIdUnscoped(uuid)
    if (!check) {
      return reply.status(404).send('Not Found')
    }

    const now = new Date().toISOString()

    let payload: Buffer | undefined
    let mimeType: string | undefined

    if (request.method === 'POST' && Buffer.isBuffer(request.body) && request.body.length > 0) {
      payload = request.body
      mimeType = request.headers['content-type'] || 'text/plain'
    }

    // Log the ping
    const insertData: Omit<Ping, 'hasPayload'> & { payload?: Buffer, mimeType?: string | null } = {
      id: crypto.randomUUID(),
      checkId: uuid,
      remoteIp: request.ip || null,
      userAgent: request.headers['user-agent'] || null,
      scheme: request.protocol,
      method: request.method,
      mimeType: mimeType || null,
      createdAt: now,
    }

    if (payload !== undefined) {
      insertData.payload = payload
    }

    await pingRepo.insert(insertData)

    // Update the check status
    await checkRepo.updateUnscoped(uuid, {
      lastPing: now,
      status: 'UP',
    })

    return reply.send('OK')
  }

  fastify.get('/:uuid', handlePing)
  fastify.post('/:uuid', handlePing)
}
