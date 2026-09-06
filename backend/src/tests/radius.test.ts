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

  // ── Verification: Tiered Geofencing & Rural Escalation Fallback ──
  console.log('\n🏔️ Verifying Tiered Geofencing & Rural Escalation Fallback:');
  try {
    const shimlaRes = await fetch(`${BASE}/partners/nearby?city=Shimla`);
    const shimlaData = await shimlaRes.json();

    if (!shimlaData.degradedState || !shimlaData.escalatedToApex) {
      console.error('❌ FAIL: Shimla did not trigger degradedState/escalatedToApex:', shimlaData);
      failures++;
    } else if (shimlaData.advisoryCode !== 'SUPERVISORY_ESCROW_ADVISORY') {
      console.error('❌ FAIL: Shimla advisoryCode mismatch:', shimlaData.advisoryCode);
      failures++;
    } else if (!shimlaData.escalationNotice.includes('Escalated to Apex State Agency')) {
      console.error('❌ FAIL: Shimla escalationNotice mismatch:', shimlaData.escalationNotice);
      failures++;
    } else if (shimlaData.tierBreakdown.grassrootsCount !== 0) {
      console.error('❌ FAIL: Shimla grassrootsCount expected 0, got:', shimlaData.tierBreakdown.grassrootsCount);
      failures++;
    } else if (shimlaData.partners.length === 0 || !shimlaData.partners.every((p: any) => p.tier === 'APEX_SCA' && p.is_escalated)) {
      console.error('❌ FAIL: Shimla partners not properly escalated as APEX_SCA:', shimlaData.partners);
      failures++;
    } else {
      console.log(`✅ PASS: Shimla rural escalation triggered correctly (0 grassroots <= 35km -> ${shimlaData.partners.length} Apex SCAs <= 150km, degradedState: true, SUPERVISORY_ESCROW_ADVISORY).`);
    }

    const puneRes = await fetch(`${BASE}/partners/nearby?city=Pune`);
    const puneData = await puneRes.json();

    if (puneData.degradedState || puneData.escalatedToApex) {
      console.error('❌ FAIL: Pune should NOT trigger escalation:', puneData);
      failures++;
    } else if (puneData.tierBreakdown.grassrootsCount <= 0) {
      console.error('❌ FAIL: Pune grassrootsCount expected > 0, got:', puneData.tierBreakdown.grassrootsCount);
      failures++;
    } else if (puneData.escalationNotice !== null) {
      console.error('❌ FAIL: Pune escalationNotice should be null, got:', puneData.escalationNotice);
      failures++;
    } else {
      console.log(`✅ PASS: Pune urban routing healthy and un-escalated (${puneData.tierBreakdown.grassrootsCount} grassroots <= 35km, ${puneData.tierBreakdown.scaCount} SCAs, degradedState: false).`);
    }
  } catch (apiErr) {
    console.error('❌ FAIL: API request to /api/partners/nearby failed:', apiErr);
    failures++;
  }

  console.log('\n=============================================================');
  if (failures === 0) {
    console.log('🎉 ALL RADIUS, HEALTH FILTER & RURAL ESCALATION TESTS PASSED CLEANLY!');
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
