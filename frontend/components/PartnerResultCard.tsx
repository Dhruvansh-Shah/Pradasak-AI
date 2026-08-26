'use client';

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  address: string;
  city: string;
  state: string;
  district?: string;
  phone: string;
  email: string;
  eligible_categories: string[];
  fund_availability_status: string;
  npa_percent?: number;
  distance_km: number;
}

const TYPE_COLORS: Record<string, string> = {
  SCA: '#3b82f6',
  PSB: '#10b981',
  RRB: '#8b5cf6',
  NBFC_MFI: '#f59e0b',
  NBFC: '#f59e0b',
  MFI: '#ec4899',
};

const FUND_STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  limited: '#f59e0b',
  exhausted: '#ef4444',
};

export default function PartnerResultCard({ partner, rank }: { partner: Partner; rank: number }) {
  const typeColor = TYPE_COLORS[partner.partner_type] || '#6b7280';
  const fundColor = FUND_STATUS_COLORS[partner.fund_availability_status] || '#10b981';

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: typeColor }}
          >
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{partner.name}</h3>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {partner.city}{partner.district ? `, ${partner.district}` : ''}, {partner.state}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            {partner.distance_km} km
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: typeColor + '1a', color: typeColor }}
          >
            {partner.partner_type}
          </span>
        </div>
      </div>

      {partner.address && (
        <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>📍 {partner.address}</p>
      )}

      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--muted)' }}>
        {partner.phone && <span>📞 {partner.phone}</span>}
        {partner.email && <span className="truncate">✉️ {partner.email}</span>}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className="px-2 py-0.5 rounded-full font-medium"
          style={{ background: fundColor + '1a', color: fundColor }}
        >
          ● Funds {partner.fund_availability_status}
        </span>
        {partner.npa_percent !== undefined && partner.npa_percent !== null && (
          <span style={{ color: 'var(--muted)' }}>NPA: {partner.npa_percent}%</span>
        )}
      </div>

      <div className="mt-2 text-xs p-1.5 rounded-lg" style={{ background: 'var(--background)', color: 'var(--muted)' }}>
        ⚠ Note: Fund availability is indicative (demo data). Verify with the partner before visiting.
      </div>
    </div>
  );
}
