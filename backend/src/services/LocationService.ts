import { pool } from '../db/pool';

// Curated lat/lng for major Indian cities
const CITY_COORDS: Record<string, [number, number]> = {
  'delhi': [28.6139, 77.2090], 'new delhi': [28.6139, 77.2090],
  'mumbai': [19.0760, 72.8777], 'bombay': [19.0760, 72.8777],
  'kolkata': [22.5726, 88.3639], 'calcutta': [22.5726, 88.3639],
  'chennai': [13.0827, 80.2707], 'madras': [13.0827, 80.2707],
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'pune': [18.5204, 73.8567],
  'surat': [21.1702, 72.8311],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'amravati': [20.9374, 77.7796],
  'akola': [20.7002, 77.0082],
  'aurangabad': [19.8762, 75.3433], 'chhatrapati sambhajinagar': [19.8762, 75.3433],
  'solapur': [17.6599, 75.9064],
  'kolhapur': [16.7050, 74.2433],
  'nanded': [19.1383, 77.3210],
  'jalgaon': [21.0077, 75.5626],
  'chandrapur': [19.9615, 79.2961],
  'latur': [18.4088, 76.5604],
  'indore': [22.7196, 75.8577],
  'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126],
  'visakhapatnam': [17.6868, 83.2185],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'faridabad': [28.4089, 77.3178],
  'meerut': [28.9845, 77.7064],
  'rajkot': [22.3039, 70.8022],
  'kalyan': [19.2437, 73.1355],
  'vasai': [19.4700, 72.8100],
  'varanasi': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973],
  'dhanbad': [23.7957, 86.4304],
  'amritsar': [31.6340, 74.8723],
  'navi mumbai': [19.0368, 73.0158],
  'allahabad': [25.4358, 81.8463], 'prayagraj': [25.4358, 81.8463],
  'ranchi': [23.3441, 85.3096],
  'howrah': [22.5958, 88.2636],
  'coimbatore': [11.0168, 76.9558],
  'jabalpur': [23.1815, 79.9864],
  'gwalior': [26.2183, 78.1828],
  'vijayawada': [16.5062, 80.6480],
  'jodhpur': [26.2389, 73.0243],
  'madurai': [9.9252, 78.1198],
  'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648],
  'chandigarh': [30.7333, 76.7794],
  'guwahati': [26.1445, 91.7362],
  'mysore': [12.2958, 76.6394], 'mysuru': [12.2958, 76.6394],
  'bhubaneswar': [20.2961, 85.8245],
  'thiruvananthapuram': [8.5241, 76.9366], 'trivandrum': [8.5241, 76.9366],
  'noida': [28.5355, 77.3910],
  'gurugram': [28.4595, 77.0266], 'gurgaon': [28.4595, 77.0266],
};

export interface GeoPoint { lat: number; lng: number }

export function geocodeCity(location: string): GeoPoint | null {
  const key = location.toLowerCase().trim();
  const coords = CITY_COORDS[key];
  if (coords) return { lat: coords[0], lng: coords[1] };

  // Partial match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(key) || key.includes(city)) {
      return { lat: coords[0], lng: coords[1] };
    }
  }
  return null;
}

export async function geocodeViaOSM(location: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', India')}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NSFDC-ChannelFinance/1.0' } });
    const data = await res.json() as { lat: string; lon: string }[];
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function geocode(location: string): Promise<GeoPoint | null> {
  return geocodeCity(location) || geocodeViaOSM(location);
}

export interface NearbyPartner {
  id: number;
  name: string;
  partner_type: string;
  address: string;
  city: string;
  state: string;
  district: string | null;
  phone: string;
  email: string;
  eligible_categories: string[];
  fund_availability_status: string;
  npa_percent: number | null;
  distance_km: number;
}

export async function findNearbyPartners(
  point: GeoPoint,
  category?: string,
  radiusKm = 150,
  limit = 5
): Promise<NearbyPartner[]> {
  // First attempt with specified radius
  const { rows } = await pool.query<NearbyPartner>(
    `SELECT
       id, name, partner_type, address, city, state, district, phone, email,
       eligible_categories, fund_availability_status, npa_percent,
       ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km
     FROM partners
     WHERE
       is_active = TRUE
       AND ($2::text IS NULL OR $2 = ANY(eligible_categories))
       AND ST_DWithin(location, ST_GeographyFromText($1), $3)
     ORDER BY distance_km ASC
     LIMIT $4`,
    [
      `SRID=4326;POINT(${point.lng} ${point.lat})`,
      category || null,
      radiusKm * 1000,
      limit,
    ]
  );

  if (rows.length > 0) return rows;

  // Fallback: search closest partners nationally or within 600km
  const { rows: fallbackRows } = await pool.query<NearbyPartner>(
    `SELECT
       id, name, partner_type, address, city, state, district, phone, email,
       eligible_categories, fund_availability_status, npa_percent,
       ROUND((ST_Distance(location, ST_GeographyFromText($1)) / 1000)::numeric, 1) AS distance_km
     FROM partners
     WHERE is_active = TRUE
     ORDER BY ST_Distance(location, ST_GeographyFromText($1)) ASC
     LIMIT $2`,
    [
      `SRID=4326;POINT(${point.lng} ${point.lat})`,
      limit,
    ]
  );

  return fallbackRows;
}
