import { sqliteTable, text, integer, customType } from 'drizzle-orm/sqlite-core';

const blobType = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'blob';
  },
  toDriver(val: Buffer): Buffer {
    return val;
  },
  fromDriver(val: Buffer): Buffer {
    return val;
  },
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['USER', 'ADMIN'] }).notNull().default('USER'),
  displayName: text('display_name'),
  description: text('description'),
  createdAt: text('created_at').notNull()
});

export const checks = sqliteTable('checks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
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
  payload: blobType('payload'),
  mimeType: text('mime_type'),
  createdAt: text('created_at').notNull()
});
