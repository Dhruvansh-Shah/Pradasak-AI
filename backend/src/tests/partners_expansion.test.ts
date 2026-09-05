import { pool } from '../db/pool';

async function runExpansionTests() {
  console.log('================== TESTING PARTNERS EXPANSION ==================\n');
  let failures = 0;

  try {
    // 1. Total counts test
    const countRes = await pool.query(`
      SELECT verification_status, COUNT(*) as count
      FROM partners
      GROUP BY verification_status
    `);
    
    const counts: Record<string, number> = {};
    countRes.rows.forEach(r => {
      counts[r.verification_status] = parseInt(r.count, 10);
    });

    console.log('Database verification status counts:', counts);

    if (counts['verified'] !== 91) {
      console.error(`❌ FAIL: Expected 91 verified partners, found ${counts['verified']}`);
      failures++;
    } else {
      console.log(`✅ PASS: Exactly 91 NSFDC VERIFIED partners preserved.`);
    }

    if (counts['additional'] !== 6) {
      console.error(`❌ FAIL: Expected 6 additional SFBs, found ${counts['additional']}`);
      failures++;
    } else {
      console.log(`✅ PASS: Exactly 6 ADDITIONAL FINANCIAL INSTITUTIONS present.`);
    }

    // 2. Specific SFB Status Verification
    const verifiedSFBs = ['AU Small Finance Bank', 'Capital Small Finance Bank', 'Equitas Small Finance Bank', 'Jana Small Finance Bank', 'Ujjivan Small Finance Bank'];
    for (const name of verifiedSFBs) {
      const res = await pool.query('SELECT verification_status FROM partners WHERE name ILIKE $1', [`%${name}%`]);
      if (res.rows.length === 0 || res.rows[0].verification_status !== 'verified') {
        console.error(`❌ FAIL: ${name} should be 'verified', got: ${res.rows[0]?.verification_status}`);
        failures++;
      } else {
        console.log(`✅ PASS: ${name} is 'verified'`);
      }
    }

    const additionalSFBs = ['ESAF Small Finance Bank', 'Suryoday Small Finance Bank', 'Utkarsh Small Finance Bank', 'Shivalik Small Finance Bank', 'Unity Small Finance Bank', 'North East Small Finance Bank'];
    for (const name of additionalSFBs) {
      const res = await pool.query('SELECT verification_status FROM partners WHERE name ILIKE $1', [`%${name}%`]);
      if (res.rows.length === 0 || res.rows[0].verification_status !== 'additional') {
        console.error(`❌ FAIL: ${name} should be 'additional', got: ${res.rows[0]?.verification_status}`);
        failures++;
      } else {
        console.log(`✅ PASS: ${name} is 'additional'`);
      }
    }

  } catch (err) {
    console.error('Database query error during test:', err);
    failures++;
  }

  console.log('\n=============================================================');
  if (failures === 0) {
    console.log('🎉 ALL PARTNER EXPANSION TESTS PASSED CLEANLY!');
    process.exit(0);
  } else {
    console.error(`💥 ${failures} EXPANSION TEST CASE(S) FAILED!`);
    process.exit(1);
  }
}

runExpansionTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
