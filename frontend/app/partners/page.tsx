'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import PartnerResultCard, { PartnerCardData } from '@/components/PartnerResultCard';
import { MapPartner } from '@/components/Map';
import {
  MapPin,
  Search,
  Navigation,
  X,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  Bot,
  Calculator,
  LocateFixed,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import { API_BASE } from '@/lib/apiBase';

const BASE = API_BASE;

// Dynamic import for Leaflet map component (SSR disabled)
const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 520, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 14 }}>
      Loading interactive map…
    </div>
  ),
});

const CATEGORY_FILTERS = [
  { id: 'All', label: 'All Categories' },
  { id: 'SCA', label: 'SCA' },
  { id: 'PSB', label: 'PSB' },
  { id: 'RRB', label: 'RRB' },
  { id: 'NBFC_MFI', label: 'NBFC-MFI' },
  { id: 'Cooperative_Bank', label: 'Co-operative Banks' },
  { id: 'Other_Agency_SIDBI', label: 'Other Agencies & SIDBI' },
  { id: 'Small_Finance_Bank', label: 'Small Finance Banks' },
  { id: 'Cooperative_Society', label: 'Cooperative Societies' },
];

const POPULAR_CITIES = ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Delhi', 'Jaipur', 'Patna', 'Bhopal', 'Hyderabad', 'Bengaluru'];

function PartnersContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [partners, setPartners] = useState<PartnerCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [radius, setRadius] = useState(25);
  const [selectedPartner, setSelectedPartner] = useState<PartnerCardData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [degradedState, setDegradedState] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState<string | null>(null);
  const [advisoryCode, setAdvisoryCode] = useState<string | null>(null);

  // Sync category filtering
  const filteredPartners = typeFilter === 'All'
    ? partners
    : partners.filter((p) => {
        if (p.partner_type === typeFilter) return true;
        if (typeFilter === 'NBFC_MFI' && (p.partner_type === 'NBFC' || p.partner_type === 'NBFC_MFI')) return true;
        return false;
      });

  async function fetchPartners(
    searchCity?: string,
    coords?: { lat: number; lng: number },
    categoryId = typeFilter,
    overrideRadius?: number
  ) {
    setLoading(true);
    setError('');
    setSelectedPartner(null);
    setDegradedState(false);
    setEscalationNotice(null);
    setAdvisoryCode(null);

    const activeRadius = overrideRadius ?? radius;

    try {
      const params = new URLSearchParams();
      if (searchCity) {
        params.set('city', searchCity);
        setCity(searchCity);
      }
      if (coords) {
        params.set('lat', String(coords.lat));
        params.set('lng', String(coords.lng));
        setUserLocation(coords);
      }
      if (categoryId && categoryId !== 'All') {
        params.set('category', categoryId);
      }
      params.set('radiusKm', String(activeRadius));

      const res = await fetch(`${BASE}/partners/nearby?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Could not locate channel partners');
      }

      const data = await res.json();
      const results: PartnerCardData[] = data.partners || [];
      setPartners(results);
      setDegradedState(Boolean(data.degradedState));
      setEscalationNotice(data.escalationNotice || null);
      setAdvisoryCode(data.advisoryCode || null);

      if (data.location && data.location.lat && data.location.lng) {
        setUserLocation({ lat: data.location.lat, lng: data.location.lng });
      }

      if (results.length > 0) {
        setSelectedPartner(results[0]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to search channel partners.');
    } finally {
      setLoading(false);
    }
  }

  // Handle GPS location search
  function locateUserGPS() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setInputCity('Current Location');
        fetchPartners(undefined, coords);
      },
      () => {
        setError('Location access denied. Please enter your city name manually.');
        setLoading(false);
      }
    );
  }

  useEffect(() => {
    const initCity = searchParams.get('city') || searchParams.get('location') || searchParams.get('q');
    if (initCity && initCity.trim()) {
      const queryCity = initCity.trim();
      setInputCity(queryCity);
      fetchPartners(queryCity);
      return;
    }

    // Attempt to read user location from profile storage
    let profileLocation = '';
    if (typeof window !== 'undefined') {
      try {
        const uStr = localStorage.getItem('auth_user');
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u.city && u.city.trim()) {
            profileLocation = u.state ? `${u.city.trim()}, ${u.state.trim()}` : u.city.trim();
          } else if (u.district && u.district.trim()) {
            profileLocation = u.state ? `${u.district.trim()}, ${u.state.trim()}` : u.district.trim();
          } else if (u.state && u.state.trim()) {
            profileLocation = u.state.trim();
          }
        }
      } catch (e) {
        console.warn('Could not parse auth_user location:', e);
      }
    }

    const defaultLocation = profileLocation || 'Pune, Maharashtra';
    setInputCity(defaultLocation);
    fetchPartners(defaultLocation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputCity.trim()) {
      fetchPartners(inputCity.trim());
    }
  }

  const TABS = [
    { id: 'chat', label: t('chat.tab_ai', 'AI Scheme Assistant'), href: '/chat', Icon: Bot },
    { id: 'emi', label: t('chat.tab_emi', 'EMI Calculator'), href: '/chat?tab=emi', Icon: Calculator },
    { id: 'partners', label: t('chat.tab_partners', 'Channel Partners'), href: '/partners', Icon: MapPin },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      {/* ── Subheader Segment Control ───────────────────────────────────────── */}
      <div
        className="material-toolbar"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="segmented-control" style={{ display: 'flex', alignItems: 'center' }}>
            {TABS.map(({ id, label, href, Icon }) => {
              const active = id === 'partners';
              return (
                <Link
                  key={id}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    border: 'none',
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#0b1f3a' : '#64748b',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    textDecoration: 'none',
                    transition: 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
                  }}
                >
                  <Icon size={14} color={active ? '#e87722' : '#94a3b8'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="page-content" style={{ maxWidth: 1240, width: '100%', margin: '0 auto', padding: '32px 24px 64px', flex: 1 }}>
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Compass size={14} />
            <span>{t('partners.badge', 'Channel Partner Locator')}</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('partners.title', 'Find Channel Partners Near You')}
          </h1>

          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 840, lineHeight: 1.6, margin: 0 }}>
            {t('partners.desc', 'Locate verified NSFDC channel partners and selected additional financial institutions near your location.')}
          </p>

          {/* ── Partner Verification Legend ─────────────────────────────────── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '12px 18px',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Partner Status Legend:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                🟢 NSFDC VERIFIED
              </span>
              <span style={{ color: '#475569', fontSize: 12 }}>Official NSFDC channel partner</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#fefce8', border: '1px solid #fef08a', color: '#a16207', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                🟡 ADDITIONAL FINANCIAL INSTITUTION
              </span>
              <span style={{ color: '#475569', fontSize: 12 }}>Additional financial institution</span>
            </div>
          </div>
        </div>

        {/* ── Search Form & Popular Cities ──────────────────────────────────── */}
        <div
          className="partner-search-card surface-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <form className="partner-search-form" onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            
            {/* Input City */}
            <div style={{ position: 'relative', flex: '1 1 320px', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder={t('partners.search_ph', 'Search city or district (e.g. Mumbai, Pune, Nagpur, Delhi, Jaipur)...')}
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 46px',
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

            {/* GPS Locate Button */}
            <button
              type="button"
              onClick={locateUserGPS}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#0b1f3a',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
              }}
            >
              <LocateFixed size={16} color="#e87722" />
              <span>Use GPS</span>
            </button>

            {/* Radius Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '0 14px', borderRadius: 12 }}>
              <SlidersHorizontal size={15} color="#64748b" />
              <select
                value={radius}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setRadius(r);
                  fetchPartners(city || inputCity.trim(), userLocation || undefined, typeFilter, r);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#334155',
                  padding: '12px 0',
                  cursor: 'pointer',
                }}
              >
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
                <option value={100}>Within 100 km</option>
                <option value={150}>Within 150 km</option>
                <option value={300}>Within 300 km</option>
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
                padding: '12px 24px',
                borderRadius: 12,
                background: '#0b1f3a',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: !inputCity.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !inputCity.trim() || loading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                transition: 'background-color 150ms ease, border-color 150ms ease, opacity 150ms ease, box-shadow 150ms ease',
              }}
            >
              <Navigation size={16} color="#fbbf24" />
              <span>{loading ? t('partners.btn_searching', 'Searching…') : t('partners.btn_locate', 'Locate Partners')}</span>
            </button>
          </form>

          {/* Popular Cities Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
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
                    fetchPartners(c);
                  }}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    padding: '4px 12px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    border: active ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                    background: active ? '#0b1f3a' : '#f8fafc',
                    color: active ? '#ffffff' : '#334155',
                    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Official Category Filter Buttons (Responsive Horizontal Scroll) ──── */}
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const active = typeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setTypeFilter(cat.id);
                  if (city) fetchPartners(city, userLocation || undefined, cat.id);
                }}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: 12.5,
                  fontWeight: active ? 800 : 600,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: active ? '2px solid #0b1f3a' : '1.5px solid #cbd5e1',
                  background: active ? '#0b1f3a' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(11,31,58,0.15)' : 'none',
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Split Layout: Partner Cards List + Leaflet Map ────────────────── */}
        <div
          className="partners-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Partner List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0b1f3a' }}>
                {filteredPartners.length} verified branches found
                {city ? ` near "${city}"` : ''}
              </span>
            </div>

            {degradedState && escalationNotice && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                }}
              >
                <ShieldAlert size={24} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#b45309',
                        background: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #fde68a',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {advisoryCode || 'SUPERVISORY ESCROW ADVISORY'}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#92400e' }}>
                      Tier-2 Automated Rural Channel Routing (Apex SCA up to 150 km)
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#78350f', margin: 0, lineHeight: 1.5 }}>
                    {escalationNotice}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, padding: '12px 16px', borderRadius: 12 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 140, background: '#e2e8f0', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredPartners.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
                {filteredPartners.map((partner) => (
                  <PartnerResultCard
                    key={partner.id}
                    partner={partner}
                    isSelected={selectedPartner?.id === partner.id}
                    onSelect={() => setSelectedPartner(partner)}
                  />
                ))}
              </div>
            ) : (
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
                  No channel partners match the selected category
                </h3>
                <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 360, lineHeight: 1.5, margin: 0 }}>
                  Try selecting "All Categories" or searching a nearby city to locate active channel partner branches.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Leaflet Map */}
          <div
            className="partner-map surface-card"
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              overflow: 'hidden',
              position: 'sticky',
              top: 80,
            }}
          >
            <LeafletMap
              userLocation={userLocation}
              partners={filteredPartners as unknown as MapPartner[]}
              selectedPartner={selectedPartner as unknown as MapPartner}
              onPartnerClick={(p) => {
                const matched = filteredPartners.find((fp) => fp.id === p.id);
                if (matched) setSelectedPartner(matched);
              }}
              height="520px"
            />

            {/* Map Legend */}
            <div
              style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: '#475569',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e40af' }} />
                  <span>SCA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#065f46' }} />
                  <span>PSB</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#047857' }} />
                  <span>RRB</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6b21a8' }} />
                  <span>NBFC-MFI</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c2410c' }} />
                  <span>Co-op Bank</span>
                </div>
              </div>

              <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                PostGIS & Leaflet
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-50">
          <div className="skeleton w-48 h-6 rounded-xl" />
        </div>
      }
    >
      <PartnersContent />
    </Suspense>
  );
}
