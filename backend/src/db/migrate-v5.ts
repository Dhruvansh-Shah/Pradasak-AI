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
  const schemaV5 = readFileSync(path.join(__dirname, 'schema-v5.sql'), 'utf8');

  console.log('Applying Schema v5 (verification_status & additional SFBs)…');
  await pool.query(schemaV5);
  console.log('Schema v5 applied successfully.');

  const res = await pool.query(`
    SELECT
      verification_status,
      COUNT(*) as count
    FROM partners
    GROUP BY verification_status
  `);

  console.log('\n📊 Partner Verification Status Distribution in Database:');
  res.rows.forEach(r => console.log(`  - ${r.verification_status}: ${r.count}`));

  await pool.end();
  console.log('\nMigration v5 Complete.');
}

run().catch((err) => {
  console.error('Migration v5 failed:', err.message);
  process.exit(1);
});
