import { pgTable, text, integer, timestamp, varchar, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const checks = pgTable('checks', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  tags: text('tags'),
  intervalSeconds: integer('interval_seconds').notNull(),
  graceSeconds: integer('grace_seconds').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('NEW'), // 'NEW', 'UP', 'DOWN', 'PAUSED'
  lastPing: timestamp('last_ping', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const pings = pgTable('pings', {
  id: uuid('id').primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  remoteIp: varchar('remote_ip', { length: 255 }),
  userAgent: text('user_agent'),
  scheme: varchar('scheme', { length: 10 }),
  method: varchar('method', { length: 10 }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});
