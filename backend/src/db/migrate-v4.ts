import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function main() {
  const schemaPath = path.join(__dirname, 'schema-v4.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  // Split by statements for clearer execution logs
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Running ${statements.length} statements...`);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      const summary = stmt.substring(0, 60).replace(/\n/g, ' ');
      console.log(`OK: ${summary}`);
    } catch (err: any) {
      console.error(`\nError executing statement:\n${stmt}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log('Migration v4 complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
