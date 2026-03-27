import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import pg from 'pg';
import * as sqliteSchema from './schema.sqlite.js';
import * as pgSchema from './schema.pg.js';
import { Check, CreateCheckDTO, Ping, UpdateCheckDTO, User } from '@healthchecks/shared';

const { Pool } = pg;

export const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
export const DATABASE_URL = process.env.DATABASE_URL || 'data.db';

let sqliteDb: ReturnType<typeof drizzleSqlite> | null = null;
let pgDb: ReturnType<typeof drizzlePg> | null = null;

if (DB_DIALECT === 'sqlite') {
  const sqlite = new Database(DATABASE_URL);
  sqliteDb = drizzleSqlite(sqlite, { schema: sqliteSchema });
} else if (DB_DIALECT === 'postgres') {
  const pool = new Pool({ connectionString: DATABASE_URL });
  pgDb = drizzlePg(pool, { schema: pgSchema });
} else {
  throw new Error(`Unsupported DB_DIALECT: ${DB_DIALECT}`);
}

// ============================================================================
// REPOSITORIES (Abstracting the dialect differences)
// ============================================================================

import { eq, and, desc } from 'drizzle-orm';

export const checkRepo = {
  async findAll(): Promise<Check[]> {
    if (sqliteDb) {
      return (await sqliteDb.select().from(sqliteSchema.checks)) as Check[];
    }
    return (await pgDb!.select().from(pgSchema.checks)) as Check[];
  },

  async findById(id: string): Promise<Check | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select().from(sqliteSchema.checks).where(eq(sqliteSchema.checks.id, id)).limit(1);
      return (res[0] as Check) || null;
    }
    const res = await pgDb!.select().from(pgSchema.checks).where(eq(pgSchema.checks.id, id)).limit(1);
    return (res[0] as Check) || null;
  },

  async insert(data: Check): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.insert(sqliteSchema.checks).values(data);
      return;
    }
    await pgDb!.insert(pgSchema.checks).values(data);
  },

  async update(id: string, data: Partial<Check>): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.update(sqliteSchema.checks).set(data).where(eq(sqliteSchema.checks.id, id));
      return;
    }
    await pgDb!.update(pgSchema.checks).set(data).where(eq(pgSchema.checks.id, id));
  },

  async delete(id: string): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.delete(sqliteSchema.checks).where(eq(sqliteSchema.checks.id, id));
      return;
    }
    await pgDb!.delete(pgSchema.checks).where(eq(pgSchema.checks.id, id));
  }
};

export const pingRepo = {
  async insert(data: Ping): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.insert(sqliteSchema.pings).values(data);
      return;
    }
    await pgDb!.insert(pgSchema.pings).values({ ...data, createdAt: new Date(data.createdAt) as any });
  },

  async findByCheckId(checkId: string, limit: number = 50): Promise<Ping[]> {
    if (sqliteDb) {
      return (await sqliteDb
        .select()
        .from(sqliteSchema.pings)
        .where(eq(sqliteSchema.pings.checkId, checkId))
        .orderBy(desc(sqliteSchema.pings.createdAt))
        .limit(limit)) as Ping[];
    }
    const res = await pgDb!
      .select()
      .from(pgSchema.pings)
      .where(eq(pgSchema.pings.checkId, checkId))
      .orderBy(desc(pgSchema.pings.createdAt))
      .limit(limit);
    return res.map(r => ({ ...r, createdAt: (r.createdAt as any).toISOString() })) as Ping[];
  }
};

export const userRepo = {
  async findByUsername(username: string): Promise<User | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select().from(sqliteSchema.users).where(eq(sqliteSchema.users.username, username)).limit(1);
      return (res[0] as User) || null;
    }
    const res = await pgDb!.select().from(pgSchema.users).where(eq(pgSchema.users.username, username)).limit(1);
    return (res[0] as unknown as User) || null;
  }
};
