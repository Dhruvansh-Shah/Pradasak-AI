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
  const schemaV6 = readFileSync(path.join(__dirname, 'schema-v6.sql'), 'utf8');

  console.log('Applying Schema v6 (Scheme Catalogue Audit Updates & Type B Informational Programmes)…');
  await pool.query(schemaV6);
  console.log('Schema v6 applied successfully.');

  const res = await pool.query(`
    SELECT
      scheme_type,
      COUNT(*) as count
    FROM schemes
    GROUP BY scheme_type
  `);

  console.log('\n📊 Scheme Catalogue Distribution in Database:');
  res.rows.forEach(r => console.log(`  - ${r.scheme_type}: ${r.count}`));

  const partnerRes = await pool.query('SELECT COUNT(*) FROM partners');
  console.log(`\n🔒 Verified Channel Partners Count (Must remain 97: 91 verified + 6 additional): ${partnerRes.rows[0].count}`);

  await pool.end();
  console.log('\nMigration v6 Complete.');
}

run().catch((err) => {
  console.error('Migration v6 failed:', err.message);
  process.exit(1);
});
