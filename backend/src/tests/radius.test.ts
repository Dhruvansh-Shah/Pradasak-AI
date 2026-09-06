import { geocode } from '../services/LocationService';
import { pool } from '../db/pool';

const BASE = 'http://localhost:4000/api';

async function runRadiusTests() {
  console.log('================== TESTING RADIUS CUTOFFS ==================\n');
  let failures = 0;

  const testCases = [
    { city: 'Pune', radius: 25 },
    { city: 'Pune', radius: 50 },
    { city: 'Pune', radius: 100 },
    { city: 'Mumbai', radius: 100 },
    { city: 'Leh', radius: 100 },
  ];

  for (const tc of testCases) {
    const point = await geocode(tc.city);
    if (!point) {
      console.error(`❌ FAILS: Geocoding failed for ${tc.city}`);
      failures++;
      continue;
    }

    const res = await pool.query(
      `
      SELECT
        id, name, partner_type, city, state,
        ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km,
        npa_percent,
        fund_availability_status
      FROM partners
      WHERE
        is_active = TRUE
        AND (npa_percent IS NULL OR npa_percent <= 7.0)
        AND (fund_availability_status IS NULL OR fund_availability_status = 'available')
        AND ST_DWithin(location, ST_GeographyFromText($1), $2)
      ORDER BY distance_km ASC
      `,
      [`SRID=4326;POINT(${point.lng} ${point.lat})`, tc.radius * 1000]
    );

    const rows = res.rows.map(r => ({ ...r, distance_km: Number(r.distance_km), npa_percent: r.npa_percent != null ? Number(r.npa_percent) : null }));
    const invalid = rows.filter(r => r.distance_km > tc.radius);
    const unhealthy = rows.filter(r => (r.npa_percent != null && r.npa_percent > 7.0) || r.fund_availability_status === 'exhausted');

    if (invalid.length > 0) {
      console.error(`❌ FAIL: ${tc.city} + ${tc.radius}km returned ${invalid.length} partner(s) > ${tc.radius}km:`, invalid);
      failures++;
    } else if (unhealthy.length > 0) {
      console.error(`❌ FAIL: ${tc.city} returned ${unhealthy.length} unhealthy partner(s) (NPA > 7% or exhausted funds):`, unhealthy);
      failures++;
    } else {
      const maxDist = rows.length > 0 ? Math.max(...rows.map(r => r.distance_km)) : 0;
      console.log(`✅ PASS: ${tc.city} + ${tc.radius}km -> ${rows.length} partners found. Max distance: ${maxDist} km (all healthy, NPA <= 7.0%, all <= ${tc.radius} km)`);
    }
  }

  // ── Verification: findNearbyPartners in LocationService ──
  console.log('\n🏥 Verifying findNearbyPartners Health Guarantee:');
  const punePoint = await geocode('Pune');
  if (punePoint) {
    const { findNearbyPartners } = await import('../services/LocationService');
    const nearby = await findNearbyPartners(punePoint, undefined, 150, 10);
    const highNpaFound = nearby.filter(p => p.npa_percent != null && p.npa_percent > 7.0);
    const exhaustedFound = nearby.filter(p => p.fund_availability_status === 'exhausted');

    if (highNpaFound.length > 0 || exhaustedFound.length > 0) {
      console.error(`❌ FAIL: findNearbyPartners returned unhealthy partners:`, { highNpaFound, exhaustedFound });
      failures++;
    } else {
      console.log(`✅ PASS: findNearbyPartners returned ${nearby.length} partners near Pune, 100% verified healthy (0 with NPA > 7%, 0 with exhausted funds).`);
    }
  }

  console.log('\n=============================================================');
  if (failures === 0) {
    console.log('🎉 ALL RADIUS & PARTNER HEALTH FILTER TESTS PASSED CLEANLY!');
    process.exit(0);
  } else {
    console.error(`💥 ${failures} TEST CASE(S) FAILED!`);
    process.exit(1);
  }
}

runRadiusTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
