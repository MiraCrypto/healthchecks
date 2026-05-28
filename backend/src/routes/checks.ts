import type { Check } from '@healthchecks/shared'
import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { CreateCheckSchema, UpdateCheckSchema } from '@healthchecks/shared'
import { z } from 'zod'
import { checkRepo, pingRepo } from '../db/DatabaseFactory.js'

const uuidSchema = z.string().uuid()

export default async function checkRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const userId = request.user!.id
    const checks = await checkRepo.findAll(userId)
    return reply.send(checks)
  })

  fastify.get('/:id', async (request, reply) => {
    const userId = request.user!.id
    const { id } = request.params as { id: string }
    if (!uuidSchema.safeParse(id).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for id' })
    }
    const check = await checkRepo.findById(id, userId)
    if (!check)
      return reply.status(404).send({ error: 'Check not found' })
    return reply.send(check)
  })

  fastify.get('/:id/pings', async (request, reply) => {
    const userId = request.user!.id
    const { id } = request.params as { id: string }
    if (!uuidSchema.safeParse(id).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for id' })
    }
    const check = await checkRepo.findById(id, userId)
    if (!check)
      return reply.status(404).send({ error: 'Check not found' })

    const pings = await pingRepo.findByCheckId(id, 50)
    return reply.send(pings)
  })

  fastify.post('/', async (request, reply) => {
    const userId = request.user!.id
    const parseRes = CreateCheckSchema.safeParse(request.body)
    if (!parseRes.success)
      return reply.status(400).send({ error: parseRes.error.issues })

    const data = parseRes.data
    const newCheck = {
      id: crypto.randomUUID(),
      userId,
      name: data.name,
      runbook: null,
      group: null,
      description: data.description || null,
      tags: data.tags || undefined,
      intervalSeconds: data.intervalSeconds ?? 3600,
      graceSeconds: data.graceSeconds ?? 900,
      status: 'NEW' as const,
      lastPing: null,
      createdAt: new Date().toISOString(),
    }

    await checkRepo.insert(newCheck)
    return reply.send(newCheck)
  })

  fastify.put('/:id', async (request, reply) => {
    const userId = request.user!.id
    const { id } = request.params as { id: string }
    if (!uuidSchema.safeParse(id).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for id' })
    }
    const parseRes = UpdateCheckSchema.safeParse(request.body)
    if (!parseRes.success)
      return reply.status(400).send({ error: parseRes.error.issues })

    const updateData: z.infer<typeof UpdateCheckSchema> = { ...parseRes.data }

    // Prevent manual updates to non-pausable statuses
    if (updateData.status && updateData.status !== 'PAUSED' && updateData.status !== 'UP') {
      return reply.status(400).send({ error: 'Invalid status update. Can only transition to PAUSED or UP.' })
    }

    // Convert undefined to null for description, runbook, group, tags to ensure they get cleared if empty
    if ('description' in updateData && updateData.description === undefined) {
      updateData.description = null
    }
    if ('runbook' in updateData && updateData.runbook === undefined) {
      updateData.runbook = null
    }
    if ('group' in updateData && updateData.group === undefined) {
      updateData.group = null
    }
    if ('tags' in updateData && updateData.tags === undefined) {
      updateData.tags = null
    }

    const cleanUpdate: Partial<Check> = {}
    if (updateData.name !== undefined)
      cleanUpdate.name = updateData.name
    if (updateData.description !== undefined)
      cleanUpdate.description = updateData.description
    if (updateData.tags !== undefined)
      cleanUpdate.tags = updateData.tags
    if (updateData.intervalSeconds !== undefined)
      cleanUpdate.intervalSeconds = updateData.intervalSeconds
    if (updateData.graceSeconds !== undefined)
      cleanUpdate.graceSeconds = updateData.graceSeconds
    if (updateData.runbook !== undefined)
      cleanUpdate.runbook = updateData.runbook
    if (updateData.group !== undefined)
      cleanUpdate.group = updateData.group
    if (updateData.status !== undefined)
      cleanUpdate.status = updateData.status

    await checkRepo.update(id, userId, cleanUpdate)
    const updated = await checkRepo.findById(id, userId)
    return reply.send(updated)
  })

  fastify.delete('/:id', async (request, reply) => {
    const userId = request.user!.id
    const { id } = request.params as { id: string }
    if (!uuidSchema.safeParse(id).success) {
      return reply.status(400).send({ error: 'Invalid UUID format for id' })
    }
    await checkRepo.delete(id, userId)
    return reply.send({ success: true })
  })
}
