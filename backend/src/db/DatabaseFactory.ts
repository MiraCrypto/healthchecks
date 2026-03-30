import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import pg from 'pg';
import * as sqliteSchema from './schema.sqlite.js';
import * as pgSchema from './schema.pg.js';

import { IUserRepository, ICheckRepository, IPingRepository } from './repositories/interfaces.js';
import { SqliteUserRepository, SqliteCheckRepository, SqlitePingRepository } from './repositories/sqlite/index.js';
import { PgUserRepository, PgCheckRepository, PgPingRepository } from './repositories/pg/index.js';

const { Pool } = pg;

export class DatabaseFactory {
  public readonly userRepo: IUserRepository;
  public readonly checkRepo: ICheckRepository;
  public readonly pingRepo: IPingRepository;

  constructor() {
    const dialect = process.env.DB_DIALECT || 'sqlite';
    const databaseUrl = process.env.DATABASE_URL || 'data.db';

    if (dialect === 'sqlite') {
      const sqlite = new Database(databaseUrl);
      const db = drizzleSqlite(sqlite, { schema: sqliteSchema });
      this.userRepo = new SqliteUserRepository(db);
      this.checkRepo = new SqliteCheckRepository(db);
      this.pingRepo = new SqlitePingRepository(db);
    } else if (dialect === 'postgres') {
      const pool = new Pool({ connectionString: databaseUrl });
      const db = drizzlePg(pool, { schema: pgSchema });
      this.userRepo = new PgUserRepository(db);
      this.checkRepo = new PgCheckRepository(db);
      this.pingRepo = new PgPingRepository(db);
    } else {
      throw new Error(`Unsupported DB_DIALECT: ${dialect}`);
    }
  }
}

// Export singleton instances
const factory = new DatabaseFactory();
export const userRepo = factory.userRepo;
export const checkRepo = factory.checkRepo;
export const pingRepo = factory.pingRepo;
