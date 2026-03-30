import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { Check, Ping, User } from '@healthchecks/shared';
import * as sqliteSchema from '../../schema.sqlite.js';
import { IUserRepository, ICheckRepository, IPingRepository } from '../interfaces.js';

type SqliteDb = ReturnType<typeof drizzle>;

export class SqliteUserRepository implements IUserRepository {
  constructor(private db: SqliteDb) {}

  async findAll(): Promise<User[]> {
    const users = await this.db.select().from(sqliteSchema.users);
    return users.map(this.mapToUser);
  }

  async findByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await this.db.select().from(sqliteSchema.users).where(eq(sqliteSchema.users.username, username)).limit(1);
    return res.length > 0 ? this.mapToUser(res[0]!) : null;
  }

  async findById(id: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await this.db.select().from(sqliteSchema.users).where(eq(sqliteSchema.users.id, id)).limit(1);
    return res.length > 0 ? this.mapToUser(res[0]!) : null;
  }

  async insert(data: User & { passwordHash: string }): Promise<void> {
    await this.db.insert(sqliteSchema.users).values(data);
  }

  async update(id: string, data: Partial<User> & { passwordHash?: string }): Promise<void> {
    await this.db.update(sqliteSchema.users).set(data).where(eq(sqliteSchema.users.id, id));
  }

  async count(): Promise<number> {
    const res = await this.db.select({ count: sql<number>`count(*)` }).from(sqliteSchema.users);
    return Number(res[0]?.count || 0);
  }

  private mapToUser(row: typeof sqliteSchema.users.$inferSelect): User & { passwordHash: string } {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      role: row.role as 'USER' | 'ADMIN',
      displayName: row.displayName,
      description: row.description,
      createdAt: row.createdAt
    };
  }
}

export class SqliteCheckRepository implements ICheckRepository {
  constructor(private db: SqliteDb) {}

  async findAll(userId: string): Promise<Check[]> {
    const res = await this.db.select().from(sqliteSchema.checks).where(eq(sqliteSchema.checks.userId, userId));
    return res.map(this.mapToCheck);
  }

  async findById(id: string, userId: string): Promise<Check | null> {
    const res = await this.db.select().from(sqliteSchema.checks).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId))).limit(1);
    return res.length > 0 ? this.mapToCheck(res[0]!) : null;
  }

  async findByIdUnscoped(id: string): Promise<Check | null> {
    const res = await this.db.select().from(sqliteSchema.checks).where(eq(sqliteSchema.checks.id, id)).limit(1);
    return res.length > 0 ? this.mapToCheck(res[0]!) : null;
  }

  async insert(data: Check): Promise<void> {
    await this.db.insert(sqliteSchema.checks).values(data);
  }

  async update(id: string, userId: string, data: Partial<Check>): Promise<void> {
    await this.db.update(sqliteSchema.checks).set(data).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId)));
  }

  async updateUnscoped(id: string, data: Partial<Check>): Promise<void> {
    await this.db.update(sqliteSchema.checks).set(data).where(eq(sqliteSchema.checks.id, id));
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.delete(sqliteSchema.checks).where(and(eq(sqliteSchema.checks.id, id), eq(sqliteSchema.checks.userId, userId)));
  }

  private mapToCheck(row: typeof sqliteSchema.checks.$inferSelect): Check {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      tags: row.tags || undefined,
      intervalSeconds: row.intervalSeconds,
      graceSeconds: row.graceSeconds,
      status: row.status as 'NEW' | 'UP' | 'DOWN' | 'PAUSED',
      lastPing: row.lastPing,
      createdAt: row.createdAt
    };
  }
}

export class SqlitePingRepository implements IPingRepository {
  constructor(private db: SqliteDb) {}

  async insert(data: Omit<Ping, 'hasPayload'> & { payload?: Buffer; mimeType?: string | null }): Promise<void> {
    const insertData = { ...data, payload: data.payload || null, mimeType: data.mimeType || null };
    await this.db.insert(sqliteSchema.pings).values(insertData);
  }

  async findByCheckId(checkId: string, limit: number = 50): Promise<Ping[]> {
    const rows = await this.db
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

    return rows.map(r => ({
      id: r.id,
      checkId: r.checkId,
      remoteIp: r.remoteIp,
      userAgent: r.userAgent,
      scheme: r.scheme,
      method: r.method,
      createdAt: r.createdAt,
      mimeType: r.mimeType,
      hasPayload: Boolean(r.hasPayload)
    }));
  }

  async findPayloadById(id: string): Promise<{ payload: Buffer | null; mimeType: string | null } | null> {
    const res = await this.db.select({ payload: sqliteSchema.pings.payload, mimeType: sqliteSchema.pings.mimeType })
      .from(sqliteSchema.pings).where(eq(sqliteSchema.pings.id, id)).limit(1);
    return res.length > 0 ? { payload: res[0]!.payload, mimeType: res[0]!.mimeType } : null;
  }
}
