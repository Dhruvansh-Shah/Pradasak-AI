'use client';

import { Building2, Landmark, MapPin, Phone, CheckCircle2, Navigation, ExternalLink, Globe, Mail } from 'lucide-react';

export interface PartnerCardData {
  id: number;
  name: string;
  partner_type: string;
  city: string;
  state: string;
  district?: string | null;
  pin_code?: string | null;
  distance_km?: number;
  address?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  fund_availability_status?: string;
  npa_percent?: number | null;
  supported_schemes?: string[];
  eligible_categories?: string[];
  verification_status?: string;
}

const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  SCA:                 { label: 'State Agency (SCA)',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', Icon: Building2 },
  PSB:                 { label: 'Public Sector Bank',        color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', Icon: Landmark },
  RRB:                 { label: 'Regional Rural Bank',       color: '#047857', bg: '#f0fdf4', border: '#bbf7d0', Icon: Landmark },
  NBFC_MFI:            { label: 'NBFC-MFI Partner',          color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', Icon: Building2 },
  Cooperative_Bank:    { label: 'Co-operative Bank',         color: '#c2410c', bg: '#fff7ed', border: '#ffedd5', Icon: Landmark },
  Other_Agency_SIDBI:  { label: 'Other Agencies & SIDBI',    color: '#0f766e', bg: '#f0fdfa', border: '#ccfbf1', Icon: Building2 },
  Small_Finance_Bank:  { label: 'Small Finance Bank',        color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', Icon: Landmark },
  Cooperative_Society: { label: 'Cooperative Society',       color: '#a16207', bg: '#fefce8', border: '#fef08a', Icon: Building2 },
  default:             { label: 'Authorized Partner',       color: '#334155', bg: '#f8fafc', border: '#e2e8f0', Icon: Building2 },
};

const CATEGORY_NAMES: Record<string, string> = {
  micro_finance: 'Micro Credit',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
  skill_development: 'Skill Dev',
};

interface PartnerResultCardProps {
  partner: PartnerCardData;
  isSelected?: boolean;
  onSelect?: () => void;
  rank?: number;
}

export default function PartnerResultCard({ partner, isSelected, onSelect }: PartnerResultCardProps) {
  const meta = TYPE_META[partner.partner_type] || TYPE_META.default;
  const Icon = meta.Icon;

  const categories = partner.eligible_categories || partner.supported_schemes || [];
  const isVerified = !partner.verification_status || partner.verification_status === 'verified';

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#ffffff',
        border: isSelected ? '2px solid #e87722' : '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: isSelected ? '0 6px 24px rgba(232, 119, 34, 0.15)' : '0 2px 8px rgba(11,31,58,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 180ms ease',
        transform: isSelected ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* ── Top Header Row: Badge & Distance ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.color,
            }}
          >
            <Icon size={16} />
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
              letterSpacing: '0.03em',
            }}
          >
            {meta.label}
          </span>

          {isVerified ? (
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
              <span>🟢 NSFDC VERIFIED</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#fefce8',
                color: '#a16207',
                border: '1px solid #fef08a',
              }}
            >
              <span>🟡 ADDITIONAL FINANCIAL INSTITUTION</span>
            </span>
          )}
        </div>

        {partner.distance_km != null && !isNaN(Number(partner.distance_km)) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#0b1f3a',
            }}
          >
            <Navigation size={12} color="#ea580c" />
            <span>
              {Number(partner.distance_km) < 1
                ? `${Math.round(Number(partner.distance_km) * 1000)} m away`
                : `${Number(partner.distance_km).toFixed(1)} km away`}
            </span>
          </div>
        )}
      </div>

      {/* ── Partner Name & Address ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a', margin: 0, lineHeight: 1.3 }}>
          {partner.name}
        </h3>

        {partner.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
            <MapPin size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {partner.address}, {partner.city}{partner.district && partner.district !== partner.city ? `, ${partner.district}` : ''}, {partner.state} {partner.pin_code || ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Supported Categories & Contacts ───────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
        
        {/* Category Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {categories.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {CATEGORY_NAMES[c] || c.replace('_', ' ')}
            </span>
          ))}
        </div>

        {/* Action Buttons / Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#0b1f3a',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Phone size={12} color="#fbbf24" />
              <span>{partner.phone}</span>
            </a>
          )}
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f1f5f9',
                color: '#0b1f3a',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Globe size={12} />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

