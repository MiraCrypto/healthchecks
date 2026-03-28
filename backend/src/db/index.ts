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

import { eq, and, desc, sql } from 'drizzle-orm';

export const checkRepo = {
  async findAll(userId: string): Promise<Check[]> {
    if (sqliteDb) {
      return (await sqliteDb.select().from(sqliteSchema.checks).where(eq(sqliteSchema.checks.userId, userId))) as Check[];
    }
    return (await pgDb!.select().from(pgSchema.checks).where(eq(pgSchema.checks.userId, userId))) as Check[];
  },

  async findById(id: string, userId: string): Promise<Check | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select().from(sqliteSchema.checks).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId))).limit(1);
      return (res[0] as Check) || null;
    }
    const res = await pgDb!.select().from(pgSchema.checks).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId))).limit(1);
    return (res[0] as Check) || null;
  },

  // NOTE: This internal function is needed by ping route which operates without authentication
  async findByIdUnscoped(id: string): Promise<Check | null> {
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

  async update(id: string, userId: string, data: Partial<Check>): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.update(sqliteSchema.checks).set(data).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId)));
      return;
    }
    await pgDb!.update(pgSchema.checks).set(data).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId)));
  },

  // Internal method for ping route
  async updateUnscoped(id: string, data: Partial<Check>): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.update(sqliteSchema.checks).set(data).where(eq(sqliteSchema.checks.id, id));
      return;
    }
    await pgDb!.update(pgSchema.checks).set(data).where(eq(pgSchema.checks.id, id));
  },

  async delete(id: string, userId: string): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.delete(sqliteSchema.checks).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId)));
      return;
    }
    await pgDb!.delete(pgSchema.checks).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId)));
  }
};

export const pingRepo = {
  async insert(data: Omit<Ping, 'hasPayload'> & { payload?: Buffer; mimeType?: string; hasPayload?: boolean }): Promise<void> {
    const insertData = { ...data, payload: data.payload || null, mimeType: data.mimeType || null };
    delete (insertData as any).hasPayload; // Ensure we don't try to insert the frontend-only field

    if (sqliteDb) {
      await sqliteDb.insert(sqliteSchema.pings).values(insertData as any);
      return;
    }
    await pgDb!.insert(pgSchema.pings).values({ ...insertData, createdAt: new Date(insertData.createdAt) as any });
  },

  async findByCheckId(checkId: string, limit: number = 50): Promise<Ping[]> {
    if (sqliteDb) {
      const rows = await sqliteDb
        .select({
          id: sqliteSchema.pings.id,
          checkId: sqliteSchema.pings.checkId,
          remoteIp: sqliteSchema.pings.remoteIp,
          userAgent: sqliteSchema.pings.userAgent,
          scheme: sqliteSchema.pings.scheme,
          method: sqliteSchema.pings.method,
          createdAt: sqliteSchema.pings.createdAt,
          mimeType: sqliteSchema.pings.mimeType,
          hasPayload: sql<boolean>`${sqliteSchema.pings.payload} IS NOT NULL`
        })
        .from(sqliteSchema.pings)
        .where(eq(sqliteSchema.pings.checkId, checkId))
        .orderBy(desc(sqliteSchema.pings.createdAt))
        .limit(limit);
      return rows.map(r => ({ ...r, hasPayload: !!r.hasPayload })) as Ping[];
    }
    const res = await pgDb!
      .select({
          id: pgSchema.pings.id,
          checkId: pgSchema.pings.checkId,
          remoteIp: pgSchema.pings.remoteIp,
          userAgent: pgSchema.pings.userAgent,
          scheme: pgSchema.pings.scheme,
          method: pgSchema.pings.method,
          createdAt: pgSchema.pings.createdAt,
          mimeType: pgSchema.pings.mimeType,
          hasPayload: sql<boolean>`${pgSchema.pings.payload} IS NOT NULL`
      })
      .from(pgSchema.pings)
      .where(eq(pgSchema.pings.checkId, checkId))
      .orderBy(desc(pgSchema.pings.createdAt))
      .limit(limit);
    return res.map(r => ({ ...r, createdAt: (r.createdAt as any).toISOString(), hasPayload: !!r.hasPayload })) as Ping[];
  },

  async findPayloadById(id: string): Promise<{ payload: Buffer | null, mimeType: string | null } | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select({ payload: sqliteSchema.pings.payload, mimeType: sqliteSchema.pings.mimeType })
        .from(sqliteSchema.pings).where(eq(sqliteSchema.pings.id, id)).limit(1);
      return res[0] || null;
    }
    const res = await pgDb!.select({ payload: pgSchema.pings.payload, mimeType: pgSchema.pings.mimeType })
      .from(pgSchema.pings).where(eq(pgSchema.pings.id, id)).limit(1);
    return res[0] || null;
  }
};

export const userRepo = {
  async findAll(): Promise<User[]> {
    if (sqliteDb) {
      return (await sqliteDb.select().from(sqliteSchema.users)) as User[];
    }
    return (await pgDb!.select().from(pgSchema.users)) as unknown as User[];
  },

  async findByUsername(username: string): Promise<User | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select().from(sqliteSchema.users).where(eq(sqliteSchema.users.username, username)).limit(1);
      return (res[0] as User) || null;
    }
    const res = await pgDb!.select().from(pgSchema.users).where(eq(pgSchema.users.username, username)).limit(1);
    return (res[0] as unknown as User) || null;
  },

  async findById(id: string): Promise<User | null> {
    if (sqliteDb) {
      const res = await sqliteDb.select().from(sqliteSchema.users).where(eq(sqliteSchema.users.id, id)).limit(1);
      return (res[0] as User) || null;
    }
    const res = await pgDb!.select().from(pgSchema.users).where(eq(pgSchema.users.id, id)).limit(1);
    return (res[0] as unknown as User) || null;
  },

  async insert(data: any): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.insert(sqliteSchema.users).values(data);
      return;
    }
    await pgDb!.insert(pgSchema.users).values({ ...data, createdAt: new Date(data.createdAt) as any });
  },

  async update(id: string, data: Partial<User> & { passwordHash?: string }): Promise<void> {
    if (sqliteDb) {
      await sqliteDb.update(sqliteSchema.users).set(data).where(eq(sqliteSchema.users.id, id));
      return;
    }
    await pgDb!.update(pgSchema.users).set(data).where(eq(pgSchema.users.id, id));
  },

  async count(): Promise<number> {
    if (sqliteDb) {
      const res = await sqliteDb.select({ count: sql`count(*)` }).from(sqliteSchema.users);
      return Number(res[0].count);
    }
    const res = await pgDb!.select({ count: sql`count(*)` }).from(pgSchema.users);
    return Number(res[0].count);
  }
};
