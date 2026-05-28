import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

const { DB_DIALECT, DATABASE_URL } = process.env
const isPostgres = DB_DIALECT === 'postgresql' || DB_DIALECT === 'postgres'

export default defineConfig({
  schema: isPostgres ? './src/db/schema.pg.ts' : './src/db/schema.sqlite.ts',
  out: isPostgres ? './drizzle/pg' : './drizzle/sqlite',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: {
    url: DATABASE_URL || (isPostgres ? 'postgresql://localhost:5432/healthchecks' : 'file:./data.db'),
  },
})
