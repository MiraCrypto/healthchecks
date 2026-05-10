import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as pgSchema from './schema.pg.js';

import { IUserRepository, ICheckRepository, IPingRepository } from './repositories/interfaces.js';
import { PgUserRepository, PgCheckRepository, PgPingRepository } from './repositories/pg/index.js';

const { Pool } = pg;

export class DatabaseFactory {
  public readonly userRepo: IUserRepository;
  public readonly checkRepo: ICheckRepository;
  public readonly pingRepo: IPingRepository;

  constructor() {
    const dialect = process.env.DB_DIALECT?.toLowerCase();
    
    if (dialect !== 'postgres' && dialect !== 'postgresql') {
      throw new Error(`Unsupported or missing DB_DIALECT: ${process.env.DB_DIALECT}. Must be 'postgres' or 'postgresql'.`);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required.");
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzlePg(pool, { schema: pgSchema });
    
    this.userRepo = new PgUserRepository(db);
    this.checkRepo = new PgCheckRepository(db);
    this.pingRepo = new PgPingRepository(db);
  }
}

// Export singleton instances
const factory = new DatabaseFactory();
export const userRepo = factory.userRepo;
export const checkRepo = factory.checkRepo;
export const pingRepo = factory.pingRepo;
