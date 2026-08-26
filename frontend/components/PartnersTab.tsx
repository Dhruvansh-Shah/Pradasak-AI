'use client';

import { useState } from 'react';
import PartnerResultCard from './PartnerResultCard';
import { Search } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const CATEGORIES = [
  { value: '', label: 'All categories' },
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
    if (!city.trim()) { setError('Please enter a city name'); return; }
    setError('');
    setLoading(true);
    setSearched(false);
    try {
      const params = new URLSearchParams({ city: city.trim(), radiusKm: radius });
      if (category) params.set('category', category);
      const res = await fetch(`${BASE}/partners/nearby?${params}`);
      if (!res.ok) throw new Error('Could not find partners');
      const data = await res.json() as { partners: Partner[]; location?: { city: string } };
      setPartners(data.partners || []);
      setSearched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Bhopal'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>Find Channel Partners</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Locate active NSFDC channel partners near you who can process your loan application.
        </p>
      </div>

      <form onSubmit={search}>
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Enter city name (e.g. Delhi)"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              {/* Popular cities */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_CITIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className="text-xs px-2.5 py-1 rounded-full border transition-all"
                    style={{
                      borderColor: city === c ? 'var(--accent)' : 'var(--border)',
                      color: city === c ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                  Loan Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                  Search Radius (km)
                </label>
                <select
                  value={radius}
                  onChange={e => setRadius(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                  <option value="200">200 km</option>
                  <option value="500">500 km</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 text-sm px-4 py-3 rounded-xl" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching…' : 'Find Partners'}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
            {partners.length === 0
              ? `No active partners found near ${city}. Try expanding the radius.`
              : `${partners.length} partner${partners.length === 1 ? '' : 's'} found near ${city}`}
          </p>
          <div className="space-y-2">
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

      {/* Info */}
      {!searched && (
        <div
          className="p-4 rounded-xl text-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Partners are filtered by active status and fund availability. NPA % is shown where available. Contact a partner to begin your loan application process.
        </div>
      )}
    </div>
  );
}
