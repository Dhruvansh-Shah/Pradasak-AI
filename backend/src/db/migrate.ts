/**
 * One-shot migration: applies schema.sql then seed.sql against DATABASE_URL.
 * Run with: npm run db:migrate
 *
 * PostGIS note: CREATE EXTENSION must be committed before ST_* functions are
 * used. We split schema and seed into separate pool.query() calls so the
 * extension is visible to the seed queries.
 */
import { readFileSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const ssl = process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_SSL === 'true'
  ? { ssl: { rejectUnauthorized: false } }
  : {};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ...ssl });

async function run() {
  const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seed = readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  console.log('Applying schema…');
  await pool.query(schema);
  // Release and re-acquire connection so PostGIS extension is fully visible
  await pool.query('SELECT 1');
  console.log('Schema applied.');

  console.log('Seeding data…');
  await pool.query(seed);
  console.log('Seed complete.');

  await pool.end();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
