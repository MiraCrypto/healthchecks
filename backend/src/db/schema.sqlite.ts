import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull()
});

export const checks = sqliteTable('checks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  tags: text('tags'),
  intervalSeconds: integer('interval_seconds').notNull(),
  graceSeconds: integer('grace_seconds').notNull(),
  status: text('status', { enum: ['NEW', 'UP', 'DOWN', 'PAUSED'] }).notNull().default('NEW'),
  lastPing: text('last_ping'),
  createdAt: text('created_at').notNull()
});

export const pings = sqliteTable('pings', {
  id: text('id').primaryKey(),
  checkId: text('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  remoteIp: text('remote_ip'),
  userAgent: text('user_agent'),
  scheme: text('scheme'),
  method: text('method'),
  createdAt: text('created_at').notNull()
});
