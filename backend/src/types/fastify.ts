import 'fastify'
import type { ICheckRepository, IPingRepository, IUserRepository } from '../db/repositories/interfaces.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: {
      userRepo: IUserRepository
      checkRepo: ICheckRepository
      pingRepo: IPingRepository
    }
  }

  interface FastifyRequest {
    user?: {
      id: string
      username: string
      role: 'USER' | 'ADMIN'
    }
  }
}
