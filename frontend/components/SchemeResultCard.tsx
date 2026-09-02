'use client';

import { CheckCircle2, AlertTriangle, Calculator, MapPin, Sparkles } from 'lucide-react';
import Interactive3DCard from './Interactive3DCard';

interface Scheme {
  id: number;
  name: string;
  short_name?: string;
  category: string;
  description: string;
  max_income_lakh: number;
  min_loan_lakh?: number;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  coverage_percent?: number;
  gender_eligibility?: string;
  score?: number;
  matchReasons?: string[];
  warnings?: string[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  micro_finance: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  term_loan: { bg: '#eff6ff', text: '#003366', border: '#bfdbfe' },
  education_loan: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
  entrepreneurship: { bg: '#fff7ed', text: '#8f4e00', border: '#fed7aa' },
  skill_development: { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
  default: { bg: '#fbf9f8', text: '#1b1c1c', border: '#e4e2e1' },
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan Scheme',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
  skill_development: 'Skill Development',
};

function fmt(rs: number | null | undefined) {
  if (rs === null || rs === undefined || isNaN(Number(rs))) return 'N/A';
  const n = Number(rs);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

interface Props {
  scheme: Scheme;
  onCalculateEMI?: (scheme: Scheme) => void;
  onFindPartners?: () => void;
  rank?: number;
}

export default function SchemeResultCard({ scheme, onCalculateEMI, onFindPartners, rank }: Props) {
  const meta = CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.default;
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <Interactive3DCard
      maxTilt={5}
      style={{
        background: '#ffffff',
        border: '1px solid #e4e2e1',
        borderRadius: 14,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {rank === 1 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: '#e87722',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(232,119,34,0.3)',
                }}
              >
                <Sparkles size={13} />
                <span>Best Match</span>
              </span>
            )}
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 6,
                background: meta.bg,
                color: meta.text,
                border: `1px solid ${meta.border}`,
              }}
            >
              {label}
            </span>
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#001e40', margin: 0, lineHeight: 1.3 }}>
            {scheme.name}
          </h3>
        </div>

        {scheme.score !== undefined && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: '#15803d',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '3px 10px',
                borderRadius: 6,
              }}
            >
              {Math.max(0, Math.min(100, Math.round(scheme.score)))}% Match
            </span>
          </div>
        )}
      </div>

      {/* 3 Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ background: '#fbf9f8', border: '1px solid #e4e2e1', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>
            Max Loan
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#001e40' }}>
            {fmt(scheme.max_loan_lakh * 100000)}
          </strong>
        </div>

        <div style={{ background: '#fbf9f8', border: '1px solid #e4e2e1', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>
            Interest Rate
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>
            {scheme.interest_rate_min === scheme.interest_rate_max
              ? `${scheme.interest_rate_min}% p.a.`
              : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
          </strong>
        </div>

        <div style={{ background: '#fbf9f8', border: '1px solid #e4e2e1', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 2 }}>
            Income Limit
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#43474f' }}>
            ≤ {fmt(scheme.max_income_lakh * 100000)}
          </strong>
        </div>
      </div>

      {/* Description */}
      {scheme.description && (
        <p style={{ fontSize: 13, color: '#43474f', lineHeight: 1.55, margin: 0 }}>
          {scheme.description}
        </p>
      )}

      {/* Match Reasons */}
      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scheme.matchReasons.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#065f46',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {scheme.warnings && scheme.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scheme.warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#8f4e00',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              <AlertTriangle size={14} color="#ea580c" style={{ flexShrink: 0 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Parameter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5, color: '#64748b' }}>
        <span style={{ background: '#f0eded', padding: '3px 8px', borderRadius: 4 }}>Tenure: up to {scheme.max_tenure_months} mo</span>
        <span style={{ background: '#f0eded', padding: '3px 8px', borderRadius: 4 }}>Moratorium: {scheme.moratorium_months_min}–{scheme.moratorium_months_max} mo</span>
        {scheme.gender_eligibility === 'women_only' && (
          <span style={{ background: '#fdf2f8', color: '#be185d', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>Women Exclusive</span>
        )}
      </div>

      {/* Actions */}
      {(onCalculateEMI || onFindPartners) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6, borderTop: '1px solid #f0eded' }}>
          {onCalculateEMI && (
            <button
              onClick={() => onCalculateEMI(scheme)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #c3c6d1',
                background: '#ffffff',
                color: '#001e40',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#001e40';
                (e.currentTarget as HTMLElement).style.background = '#f6f3f2';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#c3c6d1';
                (e.currentTarget as HTMLElement).style.background = '#ffffff';
              }}
            >
              <Calculator size={14} color="#e87722" />
              <span>Calculate EMI</span>
            </button>
          )}

          {onFindPartners && (
            <button
              onClick={onFindPartners}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#001e40',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,30,64,0.2)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#003366';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#001e40';
              }}
            >
              <MapPin size={14} color="#fbbf24" />
              <span>Find Partners</span>
            </button>
          )}
        </div>
      )}
    </Interactive3DCard>
  );
}
