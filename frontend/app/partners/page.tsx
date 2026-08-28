'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import PartnerResultCard from '@/components/PartnerResultCard';
import {
  MapPin,
  Search,
  Building2,
  Landmark,
  Phone,
  Navigation,
  X,
  SlidersHorizontal,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  address?: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  distance_km?: number;
  fund_availability_status?: string;
  supported_schemes?: string[];
  eligible_categories?: string[];
}

const CITY_COORDS: Record<string, [number, number]> = {
  delhi: [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  patna: [25.5941, 85.1376],
  bhopal: [23.2599, 77.4126],
  chandigarh: [30.7333, 76.7794],
};

const POPULAR_CITIES = ['Delhi', 'Lucknow', 'Mumbai', 'Jaipur', 'Patna', 'Bhopal', 'Hyderabad', 'Bengaluru'];

function getMapUrl(city: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.25},${lat - 0.15},${lng + 0.25},${lat + 0.15}&layer=mapnik&marker=${lat},${lng}`;
  }
  const coords = CITY_COORDS[city.toLowerCase()];
  if (coords) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${coords[1] - 0.25},${coords[0] - 0.15},${coords[1] + 0.25},${coords[0] + 0.15}&layer=mapnik&marker=${coords[0]},${coords[1]}`;
  }
  return 'https://www.openstreetmap.org/export/embed.html?bbox=68,8,97,37&layer=mapnik';
}

export default function PartnersPage() {
  const { t } = useLanguage();
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [radius, setRadius] = useState(100);

  const filtered =
    typeFilter === 'All' ? partners : partners.filter((p) => p.partner_type === typeFilter);

  async function search(searchCity: string) {
    setLoading(true);
    setError('');
    setPartners([]);
    setCity(searchCity);
    try {
      const r = await fetch(
        `${BASE}/partners/nearby?city=${encodeURIComponent(searchCity)}&radiusKm=${radius}`
      );
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'Request failed');
      }
      const d = await r.json();
      setPartners(d.partners || []);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Could not fetch partners. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputCity.trim()) search(inputCity.trim());
  }

  const hasResults = partners.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main className="page-content" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '36px 24px 64px', flex: 1 }}>
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Compass size={14} />
            <span>{t('partners.badge', 'Geo-Spatial Locator')}</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('partners.title', 'Find Channel Partners Near You')}
          </h1>

          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 740, lineHeight: 1.6, margin: 0 }}>
            {t('partners.desc', 'Locate State Channelizing Agencies (SCAs), Regional Rural Banks (RRBs), and NBFC-MFIs authorized to disburse concessional loans in your district.')}
          </p>
        </div>

        {/* ── Search Form Card ──────────────────────────────────────────────── */}
        <div
          className="partner-search-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '24px',
            marginBottom: 32,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <form className="partner-search-form" onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            
            {/* Input City */}
            <div style={{ position: 'relative', flex: '1 1 300px', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder={t('partners.search_ph', 'Enter city or district name (e.g. Lucknow, Delhi, Jaipur, Pune)...')}
                style={{
                  width: '100%',
                  padding: '13px 44px 13px 46px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
              {inputCity && (
                <button
                  type="button"
                  onClick={() => setInputCity('')}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Radius Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '0 14px', borderRadius: 12 }}>
              <SlidersHorizontal size={15} color="#64748b" />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#334155',
                  padding: '13px 0',
                  cursor: 'pointer',
                }}
              >
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
                <option value={100}>Within 100 km</option>
                <option value={200}>Within 200 km</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputCity.trim() || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px 24px',
                borderRadius: 12,
                background: '#0b1f3a',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: !inputCity.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !inputCity.trim() || loading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                transition: 'all 150ms ease',
              }}
            >
              <Navigation size={16} color="#fbbf24" />
              <span>{loading ? t('partners.btn_searching', 'Searching…') : t('partners.btn_locate', 'Locate Partners')}</span>
            </button>
          </form>

          {/* Popular Cities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: 4 }}>
              {t('partners.popular', 'Popular Cities:')}
            </span>
            {POPULAR_CITIES.map((c) => {
              const active = city.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => {
                    setInputCity(c);
                    search(c);
                  }}
                  style={{
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    padding: '5px 14px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    border: active ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                    background: active ? '#0b1f3a' : '#f8fafc',
                    color: active ? '#ffffff' : '#334155',
                    transition: 'all 150ms ease',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Split Layout: Results + Interactive Map ─────────────────────── */}
        <div
          className="partners-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {hasResults && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['All', 'SCA', 'RRB', 'NBFC'].map((t) => {
                    const active = typeFilter === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        style={{
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: active ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                          background: active ? '#0b1f3a' : '#ffffff',
                          color: active ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1f3a' }}>
                  {filtered.length} verified branches
                </span>
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, padding: '12px 16px', borderRadius: 12 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ height: 160, background: '#e2e8f0', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : hasResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
                {filtered.map((partner) => (
                  <PartnerResultCard key={partner.id} partner={partner} />
                ))}
              </div>
            ) : !loading && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={22} color="#15803d" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Search a location to view partner branches
                </h3>
                <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 320, lineHeight: 1.5, margin: 0 }}>
                  Type your city name or click on a popular city above to discover authorized State Agencies and Rural Banks.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Prominent Map Frame */}
          <div
            className="partner-map"
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              overflow: 'hidden',
              position: 'sticky',
              top: 96,
            }}
          >
            <div style={{ height: 500, width: '100%', position: 'relative' }}>
              <iframe
                src={getMapUrl(city)}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`Partners map for ${city || 'India'}`}
                loading="lazy"
              />
            </div>

            {/* Map Legend */}
            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#475569',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
                  <span>State Agency (SCA)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                  <span>Rural Bank (RRB)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9333ea' }} />
                  <span>NBFC-MFI</span>
                </div>
              </div>

              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                OpenStreetMap Geocoding
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
