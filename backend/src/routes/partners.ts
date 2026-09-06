import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { geocode } from '../services/LocationService';

const router = Router();

const DEFAULT_RADIUS_KM = 150;
const GRASSROOTS_MAX_RADIUS_KM = 35;
const SCA_MAX_RADIUS_KM = 150;
const MAX_RESULTS = 100;

export const ESCALATION_NOTICE =
  'Escalated to Apex State Agency: Local commercial branches are currently in high-NPA review; routing directly to District SCA for escrowed disbursement.';
export const ADVISORY_CODE = 'SUPERVISORY_ESCROW_ADVISORY';

// Category mapping helper to handle UI category parameters cleanly
function normalizeCategory(cat?: string): string | null {
  if (!cat || cat === 'All' || cat === 'all') return null;
  const lower = cat.toLowerCase().trim();
  if (lower === 'sca') return 'SCA';
  if (lower === 'psb') return 'PSB';
  if (lower === 'rrb') return 'RRB';
  if (lower === 'nbfc-mfi' || lower === 'nbfc_mfi' || lower === 'nbfc') return 'NBFC_MFI';
  if (lower.includes('co-operative bank') || lower.includes('cooperative_bank') || lower.includes('cooperative bank')) return 'Cooperative_Bank';
  if (lower.includes('other agencies') || lower.includes('sidbi') || lower.includes('other_agency_sidbi')) return 'Other_Agency_SIDBI';
  if (lower.includes('small finance') || lower.includes('small_finance_bank')) return 'Small_Finance_Bank';
  if (lower.includes('society') || lower.includes('cooperative_society')) return 'Cooperative_Society';
  return cat;
}

// GET /api/partners/nearby
// Query params: lat+lng OR city, category, radiusKm (optional)
router.get('/nearby', async (req: Request, res: Response) => {
  const { lat, lng, city, category, radiusKm } = req.query as {
    lat?: string;
    lng?: string;
    city?: string;
    category?: string;
    radiusKm?: string;
  };

  let latitude: number | null = null;
  let longitude: number | null = null;
  let resolvedCity = city ? city.trim() : undefined;
  const targetCategory = normalizeCategory(category);

  if (city && city.trim()) {
    const point = await geocode(city.trim());
    if (point) {
      latitude = point.lat;
      longitude = point.lng;
    }
  } else if (lat && lng) {
    latitude = parseFloat(lat);
    longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ error: 'Invalid lat/lng values' });
      return;
    }
  }

  // Default coordinates if geocoding fails or location not specified (center of India)
  const centerLat = latitude ?? 20.5937;
  const centerLng = longitude ?? 78.9629;
  const reqRadiusKm = parseFloat(radiusKm || String(DEFAULT_RADIUS_KM));

  try {
    let rawRows: any[] = [];
    let isEscalated = false;
    let grassrootsCount = 0;
    let scaCount = 0;

    if (latitude != null && longitude != null) {
      const ptParam = `SRID=4326;POINT(${centerLng} ${centerLat})`;

      if (targetCategory === 'SCA') {
        // Explicit SCA search: search up to reqRadiusKm
        const scaQuery = await pool.query(
          `
          SELECT
            id, name, partner_type, address, city, district, state, pin_code, phone, email, website,
            eligible_categories, npa_percent, fund_utilization_percent, fund_availability_status, verification_status, is_active,
            ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude
          FROM partners
          WHERE
            is_active = TRUE
            AND (npa_percent IS NULL OR npa_percent <= 7.0)
            AND (fund_availability_status IS NULL OR fund_availability_status = 'available')
            AND partner_type = 'SCA'
            AND ST_DWithin(location, ST_GeographyFromText($1), $2)
          ORDER BY
            CASE WHEN $3::text IS NOT NULL AND (city ILIKE $3 OR district ILIKE $3) THEN 0 ELSE 1 END,
            distance_km ASC
          LIMIT $4
          `,
          [ptParam, reqRadiusKm * 1000, resolvedCity ? `%${resolvedCity}%` : null, MAX_RESULTS]
        );
        rawRows = scaQuery.rows;
        scaCount = rawRows.length;
      } else {
        // Tier 1 Grassroots Search: Commercial banks / RRBs / MFIs within 35 km
        const grassrootsRadiusMeters = Math.min(reqRadiusKm, GRASSROOTS_MAX_RADIUS_KM) * 1000;
        const grassrootsQuery = await pool.query(
          `
          SELECT
            id, name, partner_type, address, city, district, state, pin_code, phone, email, website,
            eligible_categories, npa_percent, fund_utilization_percent, fund_availability_status, verification_status, is_active,
            ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude
          FROM partners
          WHERE
            is_active = TRUE
            AND (npa_percent IS NULL OR npa_percent <= 7.0)
            AND (fund_availability_status IS NULL OR fund_availability_status = 'available')
            AND ($2::text IS NULL OR partner_type = $2 OR $2 = ANY(eligible_categories))
            AND partner_type != 'SCA'
            AND ST_DWithin(location, ST_GeographyFromText($1), $3)
          ORDER BY
            CASE WHEN $4::text IS NOT NULL AND (city ILIKE $4 OR district ILIKE $4) THEN 0 ELSE 1 END,
            distance_km ASC
          LIMIT $5
          `,
          [
            ptParam,
            targetCategory,
            grassrootsRadiusMeters,
            resolvedCity ? `%${resolvedCity}%` : null,
            MAX_RESULTS,
          ]
        );
        const grassrootsRows = grassrootsQuery.rows;
        grassrootsCount = grassrootsRows.length;

        // Query Apex SCAs up to SCA_MAX_RADIUS_KM (150 km) or reqRadiusKm
        const scaRadiusMeters = Math.max(reqRadiusKm, SCA_MAX_RADIUS_KM) * 1000;
        const scaQuery = await pool.query(
          `
          SELECT
            id, name, partner_type, address, city, district, state, pin_code, phone, email, website,
            eligible_categories, npa_percent, fund_utilization_percent, fund_availability_status, verification_status, is_active,
            ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude
          FROM partners
          WHERE
            is_active = TRUE
            AND (npa_percent IS NULL OR npa_percent <= 7.0)
            AND (fund_availability_status IS NULL OR fund_availability_status = 'available')
            AND partner_type = 'SCA'
            AND ST_DWithin(location, ST_GeographyFromText($1), $2)
          ORDER BY
            CASE WHEN $3::text IS NOT NULL AND (city ILIKE $3 OR district ILIKE $3) THEN 0 ELSE 1 END,
            distance_km ASC
          LIMIT $4
          `,
          [ptParam, scaRadiusMeters, resolvedCity ? `%${resolvedCity}%` : null, MAX_RESULTS]
        );
        const scaRows = scaQuery.rows;
        scaCount = scaRows.length;

        if (grassrootsCount === 0) {
          // RURAL ESCALATION: No healthy commercial bank branches within 35km!
          // Escalate directly to Apex State Channelizing Agencies (SCAs) up to 150 km
          if (scaCount > 0) {
            rawRows = scaRows;
            isEscalated = true;
          } else {
            rawRows = [];
          }
        } else {
          // Healthy commercial branches exist
          if (targetCategory == null) {
            // General discovery: include both grassroots and SCAs within requested radius
            const combined = [...grassrootsRows, ...scaRows.filter(s => parseFloat(s.distance_km) <= reqRadiusKm)];
            combined.sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
            rawRows = combined;
          } else {
            rawRows = grassrootsRows;
          }
        }
      }
    } else if (resolvedCity) {
      // Text fallback if geocoding coordinates are missing
      const textQuery = await pool.query(
        `
        SELECT
          id, name, partner_type, address, city, district, state, pin_code, phone, email, website,
          eligible_categories, npa_percent, fund_utilization_percent, fund_availability_status, verification_status, is_active,
          ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km,
          ST_X(location::geometry) AS longitude,
          ST_Y(location::geometry) AS latitude
        FROM partners
        WHERE
          is_active = TRUE
          AND (npa_percent IS NULL OR npa_percent <= 7.0)
          AND (fund_availability_status IS NULL OR fund_availability_status = 'available')
          AND ($2::text IS NULL OR partner_type = $2 OR $2 = ANY(eligible_categories))
          AND (city ILIKE $3 OR district ILIKE $3 OR state ILIKE $3 OR address ILIKE $3)
        ORDER BY distance_km ASC
        LIMIT $4
        `,
        [
          `SRID=4326;POINT(${centerLng} ${centerLat})`,
          targetCategory,
          `%${resolvedCity}%`,
          MAX_RESULTS,
        ]
      );
      rawRows = textQuery.rows;
      grassrootsCount = rawRows.filter(r => r.partner_type !== 'SCA').length;
      scaCount = rawRows.filter(r => r.partner_type === 'SCA').length;
      if (grassrootsCount === 0 && scaCount > 0) {
        isEscalated = true;
      }
    }

    const effectiveRadiusLimit = isEscalated ? SCA_MAX_RADIUS_KM : reqRadiusKm;

    const formattedPartners = rawRows
      .map((row) => ({
        ...row,
        id: typeof row.id === 'string' ? parseInt(row.id, 10) : row.id,
        verification_status: row.verification_status || 'verified',
        distance_km: row.distance_km != null ? Number(parseFloat(row.distance_km).toFixed(1)) : null,
        latitude: row.latitude != null ? Number(row.latitude) : null,
        longitude: row.longitude != null ? Number(row.longitude) : null,
        npa_percent: row.npa_percent != null ? Number(row.npa_percent) : null,
        fund_utilization_percent: row.fund_utilization_percent != null ? Number(row.fund_utilization_percent) : null,
        is_healthy: (row.npa_percent == null || Number(row.npa_percent) <= 7.0) && (row.fund_availability_status == null || row.fund_availability_status === 'available'),
        health_status: 'HEALTHY',
        health_badge: 'Healthy Partner (<7% NPA)',
        tier: row.partner_type === 'SCA' ? 'APEX_SCA' : 'GRASSROOTS',
        is_escalated: isEscalated && row.partner_type === 'SCA',
      }))
      .filter((p) => p.distance_km == null || p.distance_km <= effectiveRadiusLimit);

    res.json({
      partners: formattedPartners,
      count: formattedPartners.length,
      location: resolvedCity
        ? { city: resolvedCity, lat: centerLat, lng: centerLng }
        : { lat: centerLat, lng: centerLng },
      filters: {
        city: resolvedCity || null,
        lat: centerLat,
        lng: centerLng,
        category: category || 'All',
        radiusKm: reqRadiusKm,
      },
      degradedState: isEscalated,
      escalatedToApex: isEscalated,
      escalationNotice: isEscalated ? ESCALATION_NOTICE : null,
      advisoryCode: isEscalated ? ADVISORY_CODE : null,
      tierBreakdown: {
        grassrootsCount,
        scaCount,
      },
    });
  } catch (err) {
    console.error('Partners route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

