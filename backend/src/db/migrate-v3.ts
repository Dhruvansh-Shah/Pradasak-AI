import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const sslConfig = process.env.DATABASE_URL?.includes('neon.tech') ? { ssl: { rejectUnauthorized: false } } : {};
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ...sslConfig });

async function main() {
  const sql = readFileSync(join(__dirname, 'schema-v3.sql'), 'utf8');
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
  console.log(`Running ${statements.length} v3 statements...`);
  for (const stmt of statements) {
    try { await pool.query(stmt); console.log('OK:', stmt.slice(0, 60).replace(/\n/g, ' ')); }
    catch (err) { console.warn('WARN:', stmt.slice(0, 60), '->', (err as Error).message); }
  }
  await pool.end();
  console.log('Migration v3 complete.');
}
main().catch(console.error);
