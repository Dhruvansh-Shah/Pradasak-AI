import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { geocodeCity } from '../services/LocationService';

const router = Router();

const MAX_NPA_PERCENT = 8.0;
const MAX_FUND_UTILIZATION_PERCENT = 85.0;
const DEFAULT_RADIUS_KM = 100;
const MAX_RESULTS = 10;

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

  let latitude: number;
  let longitude: number;
  let resolvedCity = city;

  if (city) {
    const point = geocodeCity(city);
    if (!point) {
      res.status(400).json({ error: `City "${city}" not found. Try a major Indian city name.` });
      return;
    }
    latitude = point.lat;
    longitude = point.lng;
  } else if (lat && lng) {
    latitude = parseFloat(lat);
    longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ error: 'Invalid lat/lng values' });
      return;
    }
  } else {
    res.status(400).json({ error: 'Provide either city or lat+lng parameters' });
    return;
  }
  const radius = parseFloat(radiusKm || String(DEFAULT_RADIUS_KM)) * 1000; // metres

  try {
    const result = await pool.query(
      `
      SELECT
        id, name, partner_type, address, city, state, phone, email, website,
        eligible_categories, npa_percent, fund_utilization_percent,
        ST_Distance(location, ST_GeographyFromText($1)) / 1000 AS distance_km,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM partners
      WHERE
        is_active = TRUE
        AND (npa_percent IS NULL OR npa_percent <= $2)
        AND (fund_utilization_percent IS NULL OR fund_utilization_percent <= $3)
        AND ($4::text IS NULL OR $4 = ANY(eligible_categories))
        AND ST_DWithin(location, ST_GeographyFromText($1), $5)
      ORDER BY distance_km ASC
      LIMIT $6
      `,
      [
        `SRID=4326;POINT(${longitude} ${latitude})`,
        MAX_NPA_PERCENT,
        MAX_FUND_UTILIZATION_PERCENT,
        category || null,
        radius,
        MAX_RESULTS,
      ]
    );

    res.json({
      partners: result.rows,
      location: resolvedCity ? { city: resolvedCity } : { lat: latitude, lng: longitude },
      filters: {
        lat: latitude,
        lng: longitude,
        category: category || 'all',
        radiusKm: radius / 1000,
        maxNpaPercent: MAX_NPA_PERCENT,
        maxFundUtilizationPercent: MAX_FUND_UTILIZATION_PERCENT,
      },
    });
  } catch (err) {
    console.error('Partners route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
