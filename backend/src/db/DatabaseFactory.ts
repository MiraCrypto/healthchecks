import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
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
  private readonly db: any;
  private readonly dialect: string;

  constructor() {
    this.dialect = process.env.DB_DIALECT || 'sqlite';
    const databaseUrl = process.env.DATABASE_URL || 'data.db';

    if (this.dialect === 'sqlite') {
      const sqlitePath = databaseUrl.startsWith('file:') ? databaseUrl.slice(5) : databaseUrl;
      const sqlite = new Database(sqlitePath);
      this.db = drizzleSqlite(sqlite, { schema: sqliteSchema });
      this.userRepo = new SqliteUserRepository(this.db);
      this.checkRepo = new SqliteCheckRepository(this.db);
      this.pingRepo = new SqlitePingRepository(this.db);
    } else if (this.dialect === 'postgres') {
      const pool = new Pool({ connectionString: databaseUrl });
      this.db = drizzlePg(pool, { schema: pgSchema });
      this.userRepo = new PgUserRepository(this.db);
      this.checkRepo = new PgCheckRepository(this.db);
      this.pingRepo = new PgPingRepository(this.db);
    } else {
      throw new Error(`Unsupported DB_DIALECT: ${this.dialect}`);
    }
  }

  public async runMigrations() {
    if (this.dialect === 'sqlite') {
      migrateSqlite(this.db, { migrationsFolder: './drizzle/sqlite' });
    } else if (this.dialect === 'postgres') {
      await migratePg(this.db, { migrationsFolder: './drizzle/pg' });
    }
  }
}

// Export singleton instances
export const factory = new DatabaseFactory();
export const userRepo = factory.userRepo;
export const checkRepo = factory.checkRepo;
export const pingRepo = factory.pingRepo;
