import { defineConfig } from 'drizzle-kit';

const isPostgres = process.env.DB_DIALECT === 'postgresql' || process.env.DB_DIALECT === 'postgres';

export default defineConfig({
  schema: isPostgres ? './src/db/schema.pg.ts' : './src/db/schema.sqlite.ts',
  out: isPostgres ? './drizzle/pg' : './drizzle/sqlite',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || (isPostgres ? 'postgresql://localhost:5432/healthchecks' : 'file:./data.db'),
  },
});
