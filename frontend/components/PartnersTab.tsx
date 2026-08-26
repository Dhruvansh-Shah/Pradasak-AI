'use client';

import { useState } from 'react';
import PartnerResultCard from './PartnerResultCard';
import { Search, MapPin, Compass, Navigation, SlidersHorizontal } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const CATEGORIES = [
  { value: '', label: 'All Scheme Categories' },
  { value: 'micro_finance', label: 'Micro Finance' },
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'education_loan', label: 'Education Loan' },
];

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  address?: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  eligible_categories: string[];
  npa_percent: number | null;
  fund_availability_status: string | null;
  is_active: boolean;
  distance_km?: number;
}

export default function PartnersTab() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState('100');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city or district name');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(false);
    try {
      const params = new URLSearchParams({ city: city.trim(), radiusKm: radius });
      if (category) params.set('category', category);
      const res = await fetch(`${BASE}/partners/nearby?${params}`);
      if (!res.ok) throw new Error('Could not find partners for this location');
      const data = (await res.json()) as { partners: Partner[]; location?: { city: string } };
      setPartners(data.partners || []);
      setSearched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const POPULAR_CITIES = ['Delhi', 'Lucknow', 'Mumbai', 'Jaipur', 'Patna', 'Bhopal', 'Hyderabad', 'Bengaluru'];

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '16px 20px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        width: '100%',
      }}
    >
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={16} color="#15803d" />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#15803d',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Spatial Discovery
          </span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
          Locate Active Channel Partners
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          Find authorized State Channelizing Agencies (SCAs), Regional Rural Banks, and MFIs with accurate radial distance.
        </p>
      </div>

      {/* ── Search Form Card ──────────────────────────────────────────────── */}
      <form onSubmit={search}>
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 18,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          {/* City / District Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
              City, District, or Location
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city or district name (e.g. Lucknow, Delhi, Jaipur)..."
                required
                style={{
                  width: '100%',
                  padding: '13px 16px 13px 46px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Popular City Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Popular:</span>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  style={{
                    fontSize: 12,
                    fontWeight: city === c ? 700 : 500,
                    padding: '5px 12px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    border: city === c ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                    background: city === c ? '#0b1f3a' : '#f8fafc',
                    color: city === c ? '#ffffff' : '#475569',
                    transition: 'all 150ms ease',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                Loan Scheme Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                Search Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="200">Within 200 km</option>
                <option value="500">Within 500 km</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, padding: '10px 14px', borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '13px 20px',
              borderRadius: 12,
              background: '#0b1f3a',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
              transition: 'all 150ms ease',
            }}
          >
            <Navigation size={16} color="#fbbf24" />
            <span>{loading ? 'Searching Active Partners…' : 'Find Authorized Partners'}</span>
          </button>
        </div>
      </form>

      {/* ── Results Stream ────────────────────────────────────────────────── */}
      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#334155' }}>
            <span>
              {partners.length === 0
                ? `No partners found near "${city}"`
                : `${partners.length} Authorized Partners near "${city}"`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {partners.map((p, i) => (
              <PartnerResultCard
                key={p.id}
                partner={p as unknown as Parameters<typeof PartnerResultCard>[0]['partner']}
                rank={i + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
