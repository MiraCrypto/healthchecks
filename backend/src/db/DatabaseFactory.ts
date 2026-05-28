import type { ICheckRepository, IPingRepository, IUserRepository } from './repositories/interfaces.js'
import process from 'node:process'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { PgCheckRepository, PgPingRepository, PgUserRepository } from './repositories/pg/index.js'

import { SqliteCheckRepository, SqlitePingRepository, SqliteUserRepository } from './repositories/sqlite/index.js'
import * as pgSchema from './schema.pg.js'
import * as sqliteSchema from './schema.sqlite.js'

const { Pool } = pg

export class DatabaseFactory {
  public readonly userRepo: IUserRepository
  public readonly checkRepo: ICheckRepository
  public readonly pingRepo: IPingRepository

  constructor() {
    const { DB_DIALECT, DATABASE_URL } = process.env
    const dialect = DB_DIALECT || 'sqlite'
    const databaseUrl = DATABASE_URL || 'data.db'

    if (dialect === 'sqlite') {
      const sqlite = new Database(databaseUrl)
      const db = drizzleSqlite(sqlite, { schema: sqliteSchema })
      this.userRepo = new SqliteUserRepository(db)
      this.checkRepo = new SqliteCheckRepository(db)
      this.pingRepo = new SqlitePingRepository(db)
    }
    else if (dialect === 'postgres') {
      const pool = new Pool({ connectionString: databaseUrl })
      const db = drizzlePg(pool, { schema: pgSchema })
      this.userRepo = new PgUserRepository(db)
      this.checkRepo = new PgCheckRepository(db)
      this.pingRepo = new PgPingRepository(db)
    }
    else {
      throw new Error(`Unsupported DB_DIALECT: ${dialect}`)
    }
  }
}

// Export singleton instances
const factory = new DatabaseFactory()
export const userRepo = factory.userRepo
export const checkRepo = factory.checkRepo
export const pingRepo = factory.pingRepo
