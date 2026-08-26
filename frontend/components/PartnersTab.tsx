'use client';

import { useState } from 'react';
import PartnerResultCard from './PartnerResultCard';
import { Search, MapPin, Compass, SlidersHorizontal, Navigation } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <Compass className="w-3.5 h-3.5" />
          Partner Discovery
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] tracking-tight">
          Locate Active Channel Partners
        </h2>
        <p className="text-sm text-slate-600">
          Find authorized State Channelizing Agencies (SCAs), Regional Rural Banks, and MFIs near you.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={search}>
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              City or District
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name (e.g. Lucknow, Delhi, Jaipur)..."
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              />
            </div>

            {/* Popular City Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400">Popular:</span>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    city === c
                      ? 'bg-[#0b1f3a] text-white border-[#0b1f3a]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Loan Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a] cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Search Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a] cursor-pointer"
              >
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="200">Within 200 km</option>
                <option value="500">Within 500 km</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
            <span>{loading ? 'Searching Nearby Partners…' : 'Find Authorized Partners'}</span>
          </button>
        </div>
      </form>

      {/* Results Stream */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>
              {partners.length === 0
                ? `No partners found near ${city}`
                : `${partners.length} Verified Partners near ${city}`}
            </span>
          </div>

          <div className="space-y-3">
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
