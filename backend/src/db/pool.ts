import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon (and most hosted Postgres) requires SSL. The pg library reads
// sslmode=require from the connection string automatically when using
// the @neondatabase/serverless driver; for the standard pg Pool we
// pass ssl: { rejectUnauthorized: false } as a safe fallback for
// providers that use self-signed certs. Override with ssl: true if
// you have the CA cert configured.
const sslConfig = process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_SSL === 'true'
  ? { ssl: { rejectUnauthorized: false } }
  : {};

// Read-only pool — used for LLM-generated SELECT queries (scheme recommender)
export const readonlyPool = new Pool({
  connectionString: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL,
  ...sslConfig,
});

// Full-access pool — used only for migrations and seed scripts
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...sslConfig,
});
