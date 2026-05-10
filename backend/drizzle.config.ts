import { defineConfig } from 'drizzle-kit';

const dialect = process.env.DB_DIALECT?.toLowerCase();

if (dialect !== 'postgres' && dialect !== 'postgresql') {
  throw new Error(`Unsupported or missing DB_DIALECT: ${process.env.DB_DIALECT}. Must be 'postgres' or 'postgresql'.`);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

export default defineConfig({
  schema: './src/db/schema.pg.ts',
  out: './drizzle/pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
