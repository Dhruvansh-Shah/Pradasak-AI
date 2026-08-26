'use client';

import { Building2, Landmark, MapPin, Phone, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  city: string;
  state: string;
  distance_km?: number;
  address?: string;
  phone?: string;
  fund_availability_status?: string;
  npa_percent?: number | null;
  supported_schemes?: string[];
  eligible_categories?: string[];
}

const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  SCA:     { label: 'State Agency (SCA)',    color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', Icon: Building2 },
  PSB:     { label: 'Public Sector Bank',    color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', Icon: Landmark },
  RRB:     { label: 'Regional Rural Bank',   color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', Icon: Landmark },
  NBFC:    { label: 'NBFC-MFI Partner',      color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', Icon: Building2 },
  default: { label: 'Authorized Partner',   color: '#334155', bg: '#f8fafc', border: '#e2e8f0', Icon: Building2 },
};

const CATEGORY_NAMES: Record<string, string> = {
  micro_finance: 'Micro Credit',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
  skill_development: 'Skill Dev',
};

export default function PartnerResultCard({ partner, rank }: { partner: Partner; rank?: number }) {
  const meta = TYPE_META[partner.partner_type] || TYPE_META.default;
  const Icon = meta.Icon;

  const categories = partner.eligible_categories || partner.supported_schemes || [];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '22px 24px',
        boxShadow: '0 2px 8px rgba(11,31,58,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        transition: 'all 180ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#0b1f3a';
        el.style.boxShadow = '0 6px 20px rgba(11,31,58,0.07)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#e2e8f0';
        el.style.boxShadow = '0 2px 8px rgba(11,31,58,0.03)';
      }}
    >
      {/* ── Top Header Row: Badge & Distance ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.color,
            }}
          >
            <Icon size={18} />
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {meta.label}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={12} />
            <span>Verified Active</span>
          </span>
        </div>

        {partner.distance_km != null && !isNaN(Number(partner.distance_km)) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#eef3f9',
              border: '1px solid #cbd5e1',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              color: '#0b1f3a',
            }}
          >
            <Navigation size={13} color="#ea580c" />
            <span>
              {Number(partner.distance_km) < 1
                ? `${Math.round(Number(partner.distance_km) * 1000)} m away`
                : `${Number(partner.distance_km).toFixed(1)} km from search point`}
            </span>
          </div>
        )}
      </div>

      {/* ── Partner Name & Address ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#0b1f3a', margin: 0, lineHeight: 1.3 }}>
          {partner.name}
        </h3>

        {partner.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            <MapPin size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {partner.address}, {partner.city}, {partner.state}
            </span>
          </div>
        )}
      </div>

      {/* ── Supported Categories & Contacts ───────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
        
        {/* Category Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: '#f1f5f9',
                color: '#475569',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              {CATEGORY_NAMES[c] || c.replace('_', ' ')}
            </span>
          ))}
        </div>

        {/* Action / Phone Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                background: '#0b1f3a',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(11,31,58,0.18)',
              }}
            >
              <Phone size={13} color="#fbbf24" />
              <span>{partner.phone}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
