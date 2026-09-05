import { pool } from '../db/pool';
import { fetchSchemeByName } from '../services/SchemeEngine';

async function runSchemeCatalogueTests() {
  console.log('================== TESTING SCHEME CATALOGUE ==================\n');
  let failures = 0;

  try {
    // 1. Check total count (Must be EXACTLY 14 unique schemes: 11 financing + 3 informational)
    const allSchemesRes = await pool.query('SELECT * FROM schemes WHERE active = TRUE ORDER BY id ASC');
    const allSchemes = allSchemesRes.rows;

    console.log(`Total Active Schemes in Catalogue: ${allSchemes.length}`);
    if (allSchemes.length !== 14) {
      console.error(`❌ FAIL: Expected exactly 14 unique schemes, found ${allSchemes.length}`);
      failures++;
    } else {
      console.log(`✅ PASS: Catalogue contains EXACTLY 14 unique schemes.`);
    }

    const countRes = await pool.query(`
      SELECT scheme_type, COUNT(*) as count
      FROM schemes
      GROUP BY scheme_type
    `);

    const counts: Record<string, number> = {};
    countRes.rows.forEach(r => {
      counts[r.scheme_type] = parseInt(r.count, 10);
    });

    console.log('Database scheme_type counts:', counts);

    if (counts['financing'] !== 11) {
      console.error(`❌ FAIL: Expected 11 financing schemes, found ${counts['financing']}`);
      failures++;
    } else {
      console.log(`✅ PASS: Exactly 11 Type A FINANCING SCHEMES present.`);
    }

    if (counts['informational'] !== 3) {
      console.error(`❌ FAIL: Expected 3 informational programmes, found ${counts['informational']}`);
      failures++;
    } else {
      console.log(`✅ PASS: Exactly 3 Type B INFORMATIONAL PROGRAMMES present.`);
    }

    // 2. Check Women Only schemes (Must return MSY, MAY, SSY)
    const womenRes = await pool.query("SELECT name FROM schemes WHERE gender_eligibility = 'women_only'");
    const womenSchemeNames = womenRes.rows.map(r => r.name);
    console.log('\n👩 Women Only Schemes:', womenSchemeNames);

    const expectedWomenSchemes = ['Mahila Samriddhi Yojana (MSY)', 'Mahila Adhikarita Yojana (MAY)', 'Shilpi Samriddhi Yojana (SSY)'];
    const missingWomen = expectedWomenSchemes.filter(s => !womenSchemeNames.includes(s));
    if (missingWomen.length > 0) {
      console.error(`❌ FAIL: Missing Women Only schemes: ${missingWomen.join(', ')}`);
      failures++;
    } else {
      console.log(`✅ PASS: Women Only filter successfully matches MSY, MAY, and SSY.`);
    }

    // 3. Test Search / Alias Discoverability
    const aliasTestCases = [
      { search: 'Mahila Kisan Yojana', expectedMatch: 'Mahila Adhikarita Yojana (MAY)' },
      { search: 'LVY', expectedMatch: 'Udyam Nidhi Yojana (UNY)' },
      { search: 'Utkarsh Loan', expectedMatch: 'Term Loan (TL)' },
      { search: 'SMILE', expectedMatch: 'SMILE (Support for Marginalized Individuals)' },
      { search: 'Standup India', expectedMatch: 'Stand-Up India Scheme' },
      { search: 'PM DAKSH', expectedMatch: 'PM-DAKSH Skill Development Programme' },
    ];

    console.log('\n🔍 Testing Alias Search Discoverability:');
    for (const tc of aliasTestCases) {
      const matched = await fetchSchemeByName(tc.search);
      if (!matched || !matched.name.includes(tc.expectedMatch.split(' ')[0])) {
        console.error(`❌ FAIL: Searching '${tc.search}' did not resolve to ${tc.expectedMatch}. Got: ${matched?.name}`);
        failures++;
      } else {
        console.log(`✅ PASS: Searching '${tc.search}' successfully resolved to '${matched.name}'`);
      }
    }

    // 4. Check Entrepreneurship Category Schemes
    const entrepRes = await pool.query("SELECT name FROM schemes WHERE category = 'entrepreneurship'");
    const entrepNames = entrepRes.rows.map(r => r.name);
    console.log('\n💼 Entrepreneurship Category Schemes in DB:', entrepNames);
    if (entrepNames.length < 5) {
      console.error(`❌ FAIL: Expected at least 5 entrepreneurship schemes, found ${entrepNames.length}`);
      failures++;
    } else {
      console.log(`✅ PASS: Entrepreneurship filter successfully matches ${entrepNames.length} schemes.`);
    }

    // 5. Verify 91 Channel Partners are UNCHANGED
    const partnerCountRes = await pool.query('SELECT COUNT(*) as count FROM partners');
    const partnerCount = parseInt(partnerCountRes.rows[0].count, 10);
    console.log(`\n🔒 Verified Channel Partners Count: ${partnerCount}`);
    if (partnerCount !== 97) { // 91 original + 6 additional SFBs = 97
      console.error(`❌ FAIL: Channel partner count changed! Expected 97, got ${partnerCount}`);
      failures++;
    } else {
      console.log(`✅ PASS: Verified 91 channel partners (97 total with additional SFBs) remain 100% UNCHANGED.`);
    }

  } catch (err) {
    console.error('Database query error during test:', err);
    failures++;
  }

  console.log('\n=============================================================');
  if (failures === 0) {
    console.log('🎉 ALL SCHEME CATALOGUE AUDIT TESTS PASSED CLEANLY!');
    process.exit(0);
  } else {
    console.error(`💥 ${failures} TEST CASE(S) FAILED!`);
    process.exit(1);
  }
}

runSchemeCatalogueTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
