'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Phone, Globe, Building2, AlertCircle } from 'lucide-react';
import { findPartners } from '@/lib/api';

// Leaflet must be imported dynamically (no SSR) — it uses window
const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => (
  <div className="w-full h-64 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
    <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading map…</span>
  </div>
) });

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  eligible_categories: string[];
  npa_percent: number;
  fund_utilization_percent: number;
}

interface Props {
  selectedScheme: object | null;
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  SCA: 'State Channelizing Agency',
  PSB: 'Public Sector Bank',
  RRB: 'Regional Rural Bank',
  NBFC_MFI: 'NBFC-MFI',
};

function HealthBadge({ npa, util }: { npa?: number; util?: number }) {
  const isHealthy = (npa ?? 0) <= 6 && (util ?? 0) <= 75;
  const isModerate = !isHealthy && (npa ?? 0) <= 8 && (util ?? 0) <= 85;
  const color = isHealthy ? '#059669' : isModerate ? '#d97706' : '#dc2626';
  const label = isHealthy ? 'Healthy' : isModerate ? 'Moderate' : 'Constrained';
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>
      {label}
    </span>
  );
}

export default function PartnerLocator({ selectedScheme }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const category = selectedScheme ? (selectedScheme as { category?: string }).category : undefined;

  const locate = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        try {
          const data = await findPartners(latitude, longitude, category);
          setPartners(data.partners || []);
        } catch {
          setError('Could not fetch nearby partners. Make sure the backend is running.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied. Please allow location to find nearby partners.');
        setLoading(false);
      }
    );
  };

  // Auto-search when scheme category changes (if location already granted)
  useEffect(() => {
    if (userLocation) {
      findPartners(userLocation.lat, userLocation.lng, category)
        .then((data) => setPartners(data.partners || []))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
          <MapPin className="w-7 h-7" style={{ color: '#059669' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Find nearby Channel Partners</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Only showing partners with low NPA (&le;8%) and available fund capacity (&le;85% utilization).
        </p>
        {selectedScheme && (
          <p className="text-xs px-3 py-1.5 rounded-full inline-block mb-4" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Filtered for: {(selectedScheme as { category?: string }).category?.replace('_', ' ')} schemes
          </p>
        )}
        <button
          onClick={locate}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
          style={{ background: '#059669', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {userLocation && (
        <Map
          userLocation={userLocation}
          partners={partners}
          selectedPartner={selectedPartner}
          onPartnerClick={(p) => setSelectedPartner(p as Partner)}
        />
      )}

      {partners.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            {partners.length} ELIGIBLE PARTNER{partners.length !== 1 ? 'S' : ''} NEARBY
          </h3>
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="rounded-xl border p-4 cursor-pointer transition-all"
              style={{
                background: 'var(--surface)',
                borderColor: selectedPartner?.id === partner.id ? '#059669' : 'var(--border)',
              }}
              onClick={() => setSelectedPartner(partner)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {PARTNER_TYPE_LABELS[partner.partner_type] || partner.partner_type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {partner.distance_km.toFixed(1)} km away
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{partner.name}</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {partner.address}, {partner.city}, {partner.state}
                  </p>
                </div>
                <HealthBadge npa={partner.npa_percent} util={partner.fund_utilization_percent} />
              </div>

              <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                {partner.phone && (
                  <a href={`tel:${partner.phone}`} className="flex items-center gap-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                    <Phone className="w-3 h-3" /> {partner.phone}
                  </a>
                )}
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>

              {partner.npa_percent != null && (
                <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                  <span>NPA: {partner.npa_percent}%</span>
                  <span>Fund utilization: {partner.fund_utilization_percent}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {userLocation && partners.length === 0 && !loading && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
          No eligible partners found within 50 km. Try expanding the search radius or removing the scheme filter.
        </div>
      )}
    </div>
  );
}
