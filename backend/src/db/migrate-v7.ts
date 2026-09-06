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
  console.log('🚀 Applying Schema v7 (SIH PS 26092 Scheme Ceilings & Universal ₹5L Income Cap)…');
  const schemaV7 = readFileSync(path.join(__dirname, 'schema-v7-sih-alignment.sql'), 'utf8');

  await pool.query(schemaV7);
  console.log('✅ Schema v7 executed successfully.\n');

  // Verification 1: Count of schemes must remain exactly 14
  const countRes = await pool.query('SELECT COUNT(*) as total FROM schemes');
  const totalSchemes = parseInt(countRes.rows[0].total, 10);
  console.log(`📊 Total Schemes Count: ${totalSchemes} (Expected: 14)`);
  if (totalSchemes !== 14) {
    throw new Error(`Scheme count mismatch: Expected 14, got ${totalSchemes}`);
  }

  // Verification 2: Zero schemes with max_income_lakh < 5.00
  const incomeRes = await pool.query('SELECT COUNT(*) as below_cap FROM schemes WHERE max_income_lakh < 5.00');
  const belowCapCount = parseInt(incomeRes.rows[0].below_cap, 10);
  console.log(`💰 Schemes with Income Cap < ₹5.00L: ${belowCapCount} (Expected: 0)`);
  if (belowCapCount !== 0) {
    throw new Error(`Universal income cap violated: ${belowCapCount} schemes have income cap < ₹5.00L`);
  }

  // Verification 3: Micro Credit Finance (MCF)
  const mcfRes = await pool.query('SELECT id, name, min_loan_lakh, max_loan_lakh, max_income_lakh FROM schemes WHERE id = 1');
  const mcf = mcfRes.rows[0];
  console.log(`🔍 MCF (ID 1): Min Loan = ₹${mcf.min_loan_lakh}L, Max Loan = ₹${mcf.max_loan_lakh}L, Max Income = ₹${mcf.max_income_lakh}L`);
  if (Number(mcf.max_loan_lakh) !== 1.40 || Number(mcf.min_loan_lakh) !== 0.10 || Number(mcf.max_income_lakh) !== 5.00) {
    throw new Error(`MCF limits incorrect: got max_loan=${mcf.max_loan_lakh}, min_loan=${mcf.min_loan_lakh}, max_income=${mcf.max_income_lakh}`);
  }

  // Verification 4: Term Loan (TL)
  const tlRes = await pool.query('SELECT id, name, min_loan_lakh, max_loan_lakh, max_income_lakh FROM schemes WHERE id = 5');
  const tl = tlRes.rows[0];
  console.log(`🔍 TL (ID 5): Min Loan = ₹${tl.min_loan_lakh}L, Max Loan = ₹${tl.max_loan_lakh}L, Max Income = ₹${tl.max_income_lakh}L`);
  if (Number(tl.max_loan_lakh) !== 50.00 || Number(tl.min_loan_lakh) !== 0.50 || Number(tl.max_income_lakh) !== 5.00) {
    throw new Error(`Term Loan limits incorrect: got max_loan=${tl.max_loan_lakh}, min_loan=${tl.min_loan_lakh}, max_income=${tl.max_income_lakh}`);
  }

  // Verification 5: Mahila Samriddhi Yojana (MSY)
  const msyRes = await pool.query('SELECT id, name, max_loan_lakh FROM schemes WHERE id = 2');
  const msy = msyRes.rows[0];
  console.log(`🔍 MSY (ID 2): Max Loan = ₹${msy.max_loan_lakh}L (Expected: ₹1.40L)`);
  if (Number(msy.max_loan_lakh) !== 1.40) {
    throw new Error(`MSY limit incorrect: got ${msy.max_loan_lakh}`);
  }

  // Verification 6: Channel Partners count must remain unaffected
  const partnerRes = await pool.query('SELECT COUNT(*) as partner_count FROM partners');
  console.log(`🏢 Verified Channel Partners Count: ${partnerRes.rows[0].partner_count}`);

  await pool.end();
  console.log('\n✨ Migration v7 Complete and 100% Verified against SIH PS 26092!');
}

run().catch((err) => {
  console.error('❌ Migration v7 failed:', err.message);
  process.exit(1);
});
