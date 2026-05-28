import { z } from 'zod'

export const PingSchema = z.object({
  id: z.string().uuid(),
  checkId: z.string().uuid(),
  remoteIp: z.string().nullable(),
  userAgent: z.string().nullable(),
  scheme: z.string().nullable(),
  method: z.string().nullable(),
  hasPayload: z.boolean(),
  mimeType: z.string().nullable(),
  createdAt: z.string().datetime(),
})
export type Ping = z.infer<typeof PingSchema>
