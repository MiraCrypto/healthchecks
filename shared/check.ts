import { z } from 'zod'

export const CheckStatusSchema = z.enum(['NEW', 'UP', 'DOWN', 'PAUSED'])
export type CheckStatus = z.infer<typeof CheckStatusSchema>

export const ResolvedCheckStatusSchema = z.enum(['NEW', 'UP', 'DOWN', 'PAUSED', 'LATE'])
export type ResolvedCheckStatus = z.infer<typeof ResolvedCheckStatusSchema>

export const CheckSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  runbook: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  tags: z.string().nullable().optional(),
  intervalSeconds: z.number().int().min(60),
  graceSeconds: z.number().int().min(60),
  timeout_seconds: z.number().int().min(60).optional(),
  status: CheckStatusSchema,
  lastPing: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})
export type Check = z.infer<typeof CheckSchema>

// The API response returned by formatCheck
export type ResolvedCheck = Omit<Check, 'status'> & { status: ResolvedCheckStatus, timeout_seconds?: number }

export const CreateCheckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  userId: z.string().uuid().optional(),
  tags: z.string().optional(),
  intervalSeconds: z.number().int().min(60).optional(),
  graceSeconds: z.number().int().min(60).optional(),
  timeout_seconds: z.number().int().min(60).optional(),
})
export type CreateCheckDTO = z.infer<typeof CreateCheckSchema>

export const UpdateCheckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  tags: z.string().nullable().optional(),
  intervalSeconds: z.number().int().min(60).optional(),
  graceSeconds: z.number().int().min(60).optional(),
  timeout_seconds: z.number().int().min(60).optional(),
  runbook: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  status: z.enum(['UP', 'DOWN', 'NEW', 'PAUSED']).optional(),
})
export type UpdateCheckDTO = z.infer<typeof UpdateCheckSchema>
