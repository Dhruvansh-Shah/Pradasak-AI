'use client';

import { useState, useRef, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { MapPin, Search, Building2, Landmark, Phone, Navigation, X, SlidersHorizontal } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Partner {
  id: number;
  name: string;
  type: string;
  address?: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  distance_km?: number;
  supported_schemes?: string[];
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  SCA:     { label: 'State Chanelling Agency', color: '#1d4ed8', bg: '#eff6ff', Icon: Building2 },
  RRB:     { label: 'Regional Rural Bank',     color: '#15803d', bg: '#f0fdf4', Icon: Landmark },
  NBFC:    { label: 'NBFC-MFI',               color: '#7e22ce', bg: '#fdf4ff', Icon: Building2 },
  default: { label: 'Partner',                 color: '#0a1f44', bg: '#f0f4ff', Icon: Building2 },
};

const CITY_COORDS: Record<string, [number, number]> = {
  delhi: [28.6139, 77.2090], mumbai: [19.0760, 72.8777], bangalore: [12.9716, 77.5946],
  hyderabad: [17.3850, 78.4867], chennai: [13.0827, 80.2707], kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567], ahmedabad: [23.0225, 72.5714], jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462], patna: [25.5941, 85.1376], bhopal: [23.2599, 77.4126],
};

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Lucknow', 'Patna', 'Jaipur', 'Bhopal', 'Hyderabad', 'Kolkata'];

function getMapUrl(city: string, lat?: number, lng?: number): string {
  if (lat && lng) return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.3},${lat - 0.2},${lng + 0.3},${lat + 0.2}&layer=mapnik&marker=${lat},${lng}`;
  const coords = CITY_COORDS[city.toLowerCase()];
  if (coords) return `https://www.openstreetmap.org/export/embed.html?bbox=${coords[1] - 0.3},${coords[0] - 0.2},${coords[1] + 0.3},${coords[0] + 0.2}&layer=mapnik&marker=${coords[0]},${coords[1]}`;
  return 'https://www.openstreetmap.org/export/embed.html?bbox=68,8,97,37&layer=mapnik';
}

function PartnerCard({ partner, delay }: { partner: Partner; delay: number }) {
  const meta = TYPE_META[partner.type] || TYPE_META.default;
  const PartnerIcon = meta.Icon;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="partner-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: meta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <PartnerIcon size={18} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>
            {partner.name}
          </h3>
          <span style={{
            fontSize: 11, fontWeight: 600, color: meta.color,
            background: meta.bg, padding: '2px 8px', borderRadius: 20,
          }}>
            {meta.label}
          </span>
        </div>
        {partner.distance_km != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
              {partner.distance_km < 1
                ? `${(partner.distance_km * 1000).toFixed(0)}m`
                : `${partner.distance_km.toFixed(1)}`}
            </div>
            {partner.distance_km >= 1 && (
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>km away</div>
            )}
          </div>
        )}
      </div>

      {partner.address && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 10 }}>
          <MapPin size={13} color="var(--muted)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {partner.address}, {partner.city}, {partner.state}
          </p>
        </div>
      )}

      {partner.phone && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
          <Phone size={13} color="var(--muted)" />
          <a href={`tel:${partner.phone}`} style={{ fontSize: 12.5, color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
            {partner.phone}
          </a>
        </div>
      )}

      {partner.supported_schemes && partner.supported_schemes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {partner.supported_schemes.slice(0, 3).map(s => (
            <span key={s} style={{ fontSize: 11, background: 'var(--surface)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)', fontWeight: 500 }}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnersPage() {
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [radius, setRadius] = useState(100);
  const [mapLoaded, setMapLoaded] = useState(false);

  const filtered = typeFilter === 'All' ? partners : partners.filter(p => p.type === typeFilter);

  async function search(searchCity: string) {
    setLoading(true); setError(''); setPartners([]); setMapLoaded(false);
    setCity(searchCity);
    try {
      const r = await fetch(`${BASE}/partners/nearby?city=${encodeURIComponent(searchCity)}&radius=${radius}`);
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Request failed'); }
      const d = await r.json();
      setPartners(d.partners || []);
      setTimeout(() => setMapLoaded(true), 400);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not fetch partners. Please try again.');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .partner-card {
          background: white; border-radius: 12px;
          border: 1px solid var(--border); padding: 18px;
          box-shadow: var(--shadow-sm);
          opacity: 0; transform: translateX(-10px);
          transition: opacity .4s ease, transform .4s ease, box-shadow .2s ease;
        }
        .partner-card.in { opacity: 1; transform: translateX(0); }
        .partner-card:hover { box-shadow: var(--shadow); }
        .map-frame {
          opacity: 0; transition: opacity .6s ease;
        }
        .map-frame.loaded { opacity: 1; }
      `}</style>

      <NavBar />

      <main style={{ flex: 1, background: 'var(--surface)', padding: '40px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div className="animate-fade-up" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Channel Partners
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em' }}>Find Partners Near You</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Locate state agencies, rural banks, and MFIs within your district that process NSFDC loan applications.
            </p>
          </div>

          {/* Search row */}
          <form onSubmit={onSubmit} className="animate-fade-up delay-100" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={inputCity}
                onChange={e => setInputCity(e.target.value)}
                placeholder="Enter city name…"
                style={{
                  width: '100%', padding: '12px 40px 12px 40px',
                  borderRadius: 10, border: '1.5px solid var(--border)',
                  fontSize: 14, background: 'white', color: 'var(--text)',
                }}
              />
              {inputCity && (
                <button
                  type="button"
                  onClick={() => setInputCity('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '0 14px' }}>
              <SlidersHorizontal size={14} color="var(--muted)" />
              <select
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ border: 'none', background: 'none', fontSize: 13, color: 'var(--text)', cursor: 'pointer', padding: '12px 0' }}
              >
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={200}>200 km</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!inputCity.trim() || loading}
              style={{
                padding: '12px 24px', borderRadius: 10,
                background: 'var(--navy)', color: 'white',
                border: 'none', fontWeight: 600, fontSize: 14,
                cursor: inputCity.trim() && !loading ? 'pointer' : 'not-allowed',
                opacity: !inputCity.trim() ? .5 : 1,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => { if (inputCity.trim() && !loading) (e.currentTarget as HTMLElement).style.background = 'var(--navy-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; }}
            >
              <Navigation size={15} />
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* Popular cities */}
          <div className="animate-fade-up delay-150" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {POPULAR_CITIES.map(c => (
              <button
                key={c}
                onClick={() => { setInputCity(c); search(c); }}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: city.toLowerCase() === c.toLowerCase() ? 'var(--navy)' : 'white',
                  color: city.toLowerCase() === c.toLowerCase() ? 'white' : 'var(--text-secondary)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 180ms ease',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (city.toLowerCase() !== c.toLowerCase()) {
                    el.style.background = 'var(--surface)';
                    el.style.borderColor = 'var(--navy)';
                    el.style.color = 'var(--navy)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (city.toLowerCase() !== c.toLowerCase()) {
                    el.style.background = 'white';
                    el.style.borderColor = 'var(--border)';
                    el.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <MapPin size={11} />
                {c}
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div style={{ display: 'grid', gridTemplateColumns: hasResults ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
            {/* Results list */}
            {(hasResults || loading || error) && (
              <div>
                {/* Type filter */}
                {hasResults && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {['All', 'SCA', 'RRB', 'NBFC'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        style={{
                          padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: '1px solid',
                          borderColor: typeFilter === t ? 'var(--navy)' : 'var(--border)',
                          background: typeFilter === t ? 'var(--navy)' : 'white',
                          color: typeFilter === t ? 'white' : 'var(--text-secondary)',
                          transition: 'all 150ms ease',
                        }}
                      >
                        {t} {t !== 'All' && `(${partners.filter(p => p.type === t).length})`}
                      </button>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {loading
                    ? 'Searching nearby partners…'
                    : error
                      ? null
                      : <><strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> partners near {city}</>
                  }
                </p>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
                      ))
                    : filtered.map((p, i) => <PartnerCard key={p.id} partner={p} delay={i * 60} />)
                  }
                </div>
              </div>
            )}

            {/* Map / empty state */}
            <div>
              {hasResults ? (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', height: 460 }}>
                  <iframe
                    src={getMapUrl(city)}
                    className={`map-frame${mapLoaded ? ' loaded' : ''}`}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    title={`Partners near ${city}`}
                    onLoad={() => setMapLoaded(true)}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'white', borderRadius: 8, padding: '8px 12px',
                    boxShadow: 'var(--shadow)', fontSize: 11, color: 'var(--muted)',
                    display: 'flex', gap: 12,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />
                      SCA
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
                      RRB
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7e22ce', display: 'inline-block' }} />
                      NBFC
                    </span>
                  </div>
                </div>
              ) : !loading && (
                <div className="animate-fade-up delay-200" style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '64px 40px',
                  textAlign: 'center', boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: 64, height: 64, background: 'var(--navy-light)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 20px',
                  }}>
                    <MapPin size={28} color="var(--navy)" />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Find channel partners</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                    Enter your city above to locate state channelling agencies, rural banks, and microfinance institutions near you.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 32, textAlign: 'left' }}>
                    {[
                      { title: 'State Chanelling Agency', desc: 'Government-backed agencies operating at state level', color: '#1d4ed8', bg: '#eff6ff' },
                      { title: 'Regional Rural Bank', desc: 'RRBs serving rural and semi-urban beneficiaries', color: '#15803d', bg: '#f0fdf4' },
                      { title: 'NBFC-MFI', desc: 'Microfinance institutions for last-mile credit delivery', color: '#7e22ce', bg: '#fdf4ff' },
                    ].map(item => (
                      <div key={item.title} style={{ background: item.bg, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.title}</div>
                        <div style={{ fontSize: 11.5, color: item.color, opacity: .8, lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
