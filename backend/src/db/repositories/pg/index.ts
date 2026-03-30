import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Check, Ping, User } from '@healthchecks/shared';
import * as pgSchema from '../../schema.pg.js';
import { IUserRepository, ICheckRepository, IPingRepository } from '../interfaces.js';

type PgDb = ReturnType<typeof drizzle>;

export class PgUserRepository implements IUserRepository {
  constructor(private db: PgDb) {}

  async findAll(): Promise<User[]> {
    const users = await this.db.select().from(pgSchema.users);
    return users.map(this.mapToUser);
  }

  async findByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await this.db.select().from(pgSchema.users).where(eq(pgSchema.users.username, username)).limit(1);
    return res.length > 0 ? this.mapToUser(res[0]!) : null;
  }

  async findById(id: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await this.db.select().from(pgSchema.users).where(eq(pgSchema.users.id, id)).limit(1);
    return res.length > 0 ? this.mapToUser(res[0]!) : null;
  }

  async insert(data: User & { passwordHash: string }): Promise<void> {
    await this.db.insert(pgSchema.users).values(data);
  }

  async update(id: string, data: Partial<User> & { passwordHash?: string }): Promise<void> {
    await this.db.update(pgSchema.users).set(data).where(eq(pgSchema.users.id, id));
  }

  async count(): Promise<number> {
    const res = await this.db.select({ count: sql<number>`count(*)` }).from(pgSchema.users);
    return Number(res[0]?.count || 0);
  }

  private mapToUser(row: typeof pgSchema.users.$inferSelect): User & { passwordHash: string } {
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

export class PgCheckRepository implements ICheckRepository {
  constructor(private db: PgDb) {}

  async findAll(userId: string): Promise<Check[]> {
    const res = await this.db.select().from(pgSchema.checks).where(eq(pgSchema.checks.userId, userId));
    return res.map(this.mapToCheck);
  }

  async findById(id: string, userId: string): Promise<Check | null> {
    const res = await this.db.select().from(pgSchema.checks).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId))).limit(1);
    return res.length > 0 ? this.mapToCheck(res[0]!) : null;
  }

  async findByIdUnscoped(id: string): Promise<Check | null> {
    const res = await this.db.select().from(pgSchema.checks).where(eq(pgSchema.checks.id, id)).limit(1);
    return res.length > 0 ? this.mapToCheck(res[0]!) : null;
  }

  async insert(data: Check): Promise<void> {
    await this.db.insert(pgSchema.checks).values(data);
  }

  async update(id: string, userId: string, data: Partial<Check>): Promise<void> {
    await this.db.update(pgSchema.checks).set(data).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId)));
  }

  async updateUnscoped(id: string, data: Partial<Check>): Promise<void> {
    await this.db.update(pgSchema.checks).set(data).where(eq(pgSchema.checks.id, id));
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.delete(pgSchema.checks).where(and(eq(pgSchema.checks.id, id), eq(pgSchema.checks.userId, userId)));
  }

  private mapToCheck(row: typeof pgSchema.checks.$inferSelect): Check {
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

export class PgPingRepository implements IPingRepository {
  constructor(private db: PgDb) {}

  async insert(data: Omit<Ping, 'hasPayload'> & { payload?: Buffer; mimeType?: string | null }): Promise<void> {
    const insertData = { ...data, payload: data.payload || null, mimeType: data.mimeType || null };
    await this.db.insert(pgSchema.pings).values({
      ...insertData,
      createdAt: new Date(insertData.createdAt)
    });
  }

  async findByCheckId(checkId: string, limit: number = 50): Promise<Ping[]> {
    const rows = await this.db
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

    return rows.map(r => ({
      id: r.id,
      checkId: r.checkId,
      remoteIp: r.remoteIp,
      userAgent: r.userAgent,
      scheme: r.scheme,
      method: r.method,
      createdAt: r.createdAt.toISOString(),
      mimeType: r.mimeType,
      hasPayload: Boolean(r.hasPayload)
    }));
  }

  async findPayloadById(id: string): Promise<{ payload: Buffer | null; mimeType: string | null } | null> {
    const res = await this.db.select({ payload: pgSchema.pings.payload, mimeType: pgSchema.pings.mimeType })
      .from(pgSchema.pings).where(eq(pgSchema.pings.id, id)).limit(1);
    return res.length > 0 ? { payload: res[0]!.payload, mimeType: res[0]!.mimeType } : null;
  }
}
