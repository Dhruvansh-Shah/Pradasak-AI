'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  MapPin,
  Search,
  Building2,
  Landmark,
  Phone,
  Navigation,
  X,
  SlidersHorizontal,
  ShieldCheck,
  Compass
} from 'lucide-react';

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
  fund_availability_status?: string;
  supported_schemes?: string[];
}

const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  SCA:     { label: 'State Channelizing Agency', color: 'text-blue-800',    bg: 'bg-blue-50',    border: 'border-blue-200',    Icon: Building2 },
  RRB:     { label: 'Regional Rural Bank',       color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: Landmark },
  NBFC:    { label: 'NBFC-MFI Partner',          color: 'text-purple-800',  bg: 'bg-purple-50',  border: 'border-purple-200',  Icon: Building2 },
  default: { label: 'Channel Partner',           color: 'text-slate-800',   bg: 'bg-slate-50',   border: 'border-slate-200',   Icon: Building2 },
};

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

function PartnerCard({ partner }: { partner: Partner }) {
  const meta = TYPE_META[partner.type] || TYPE_META.default;
  const Icon = meta.Icon;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0 border ${meta.border}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
              {meta.label}
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 mt-1">
              {partner.name}
            </h3>
          </div>
        </div>

        {partner.distance_km != null && (
          <div className="text-right flex-shrink-0 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <div className="text-sm font-extrabold text-[#0b1f3a]">
              {partner.distance_km < 1
                ? `${(partner.distance_km * 1000).toFixed(0)}m`
                : `${partner.distance_km.toFixed(1)} km`}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">away</div>
          </div>
        )}
      </div>

      {partner.address && (
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span>
            {partner.address}, {partner.city}, {partner.state}
          </span>
        </div>
      )}

      {partner.phone && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0b1f3a]">
          <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <a href={`tel:${partner.phone}`} className="hover:underline">
            {partner.phone}
          </a>
        </div>
      )}

      {partner.supported_schemes && partner.supported_schemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {partner.supported_schemes.map((s) => (
            <span
              key={s}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
            >
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

  const filtered =
    typeFilter === 'All' ? partners : partners.filter((p) => p.type === typeFilter);

  async function search(searchCity: string) {
    setLoading(true);
    setError('');
    setPartners([]);
    setCity(searchCity);
    try {
      const r = await fetch(
        `${BASE}/partners/nearby?city=${encodeURIComponent(searchCity)}&radius=${radius}`
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <Compass className="w-3.5 h-3.5" />
            Geo-Spatial Locator
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1f3a] tracking-tight">
            Find Channel Partners Near You
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
            Locate State Channelizing Agencies (SCAs), Regional Rural Banks (RRBs), and NBFC-MFIs authorized to disburse concessional loans in your district.
          </p>
        </div>

        {/* ── Search Form & Radius ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 space-y-4">
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder="Enter city or district name (e.g. Lucknow, Delhi, Pune, Jaipur)..."
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#0b1f3a]"
              />
              {inputCity && (
                <button
                  type="button"
                  onClick={() => setInputCity('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer py-1.5"
              >
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
                <option value={100}>Within 100 km</option>
                <option value={200}>Within 200 km</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!inputCity.trim() || loading}
              className="btn-primary py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>{loading ? 'Searching…' : 'Locate Partners'}</span>
            </button>
          </form>

          {/* Quick City Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Popular:
            </span>
            {POPULAR_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setInputCity(c);
                  search(c);
                }}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'bg-[#0b1f3a] text-white border-[#0b1f3a]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Split Layout: Results + Interactive Map ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Results List */}
          <div className="lg:col-span-5 space-y-4">
            
            {hasResults && (
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {['All', 'SCA', 'RRB', 'NBFC'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                        typeFilter === t
                          ? 'bg-[#0b1f3a] text-white border-[#0b1f3a]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {filtered.length} found
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-4 rounded-xl">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-32 rounded-2xl" />
                ))}
              </div>
            ) : hasResults ? (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filtered.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            ) : !loading && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  Search a location to view partner branches
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Type your city or district name above to discover verified channelizing agencies.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Prominent Map Frame */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="h-[480px] sm:h-[540px] w-full relative">
                <iframe
                  src={getMapUrl(city)}
                  className="w-full h-full border-none"
                  title={`Partners map for ${city || 'India'}`}
                  loading="lazy"
                />
              </div>

              {/* Map Footer Legend */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span>State Agency (SCA)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span>Rural Bank (RRB)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                    <span>NBFC-MFI</span>
                  </div>
                </div>

                <span className="text-slate-400 text-[11px]">
                  © OpenStreetMap Contributors
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
