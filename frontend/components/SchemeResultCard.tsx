'use client';

import { CheckCircle2, AlertTriangle, Calculator, Sparkles, BookOpen, FileText } from 'lucide-react';
import Interactive3DCard from './Interactive3DCard';
import VoiceButton from './VoiceButton';

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
  onKnowMore?: (scheme: Scheme) => void;
  onGetDocuments?: (scheme: Scheme) => void;
  onCalculateEMI?: (scheme: Scheme) => void;
  onFindPartners?: () => void;
  rank?: number;
  speechText?: string;
  onPlayVoice?: () => void;
  onStopVoice?: () => void;
  isVoicePlaying?: boolean;
  isVoiceLoading?: boolean;
}

export default function SchemeResultCard({
  scheme,
  onKnowMore,
  onGetDocuments,
  onCalculateEMI,
  rank,
  speechText,
  onPlayVoice,
  onStopVoice,
  isVoicePlaying,
  isVoiceLoading,
}: Props) {
  const meta = CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.default;
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <Interactive3DCard
      maxTilt={5}
      style={{
        background: 'var(--surface, #ffffff)',
        border: '1px solid var(--border, #e4e2e1)',
        borderRadius: 14,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        color: 'var(--text)',
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

      {/* Visually Attached Scheme Action Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
          paddingTop: 12,
          borderTop: '1.5px solid #e2e8f0',
          marginTop: 2,
        }}
      >
        {onKnowMore && (
          <button
            type="button"
            onClick={() => onKnowMore(scheme)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #0284c7',
              background: '#f0f9ff',
              color: '#0369a1',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#0284c7';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f0f9ff';
              (e.currentTarget as HTMLElement).style.color = '#0369a1';
            }}
          >
            <BookOpen size={14} />
            <span>Know More</span>
          </button>
        )}

        {onGetDocuments && (
          <button
            type="button"
            onClick={() => onGetDocuments(scheme)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #059669',
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#059669';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#ecfdf5';
              (e.currentTarget as HTMLElement).style.color = '#065f46';
            }}
          >
            <FileText size={14} />
            <span>Required Documents</span>
          </button>
        )}

        {onCalculateEMI && (
          <button
            type="button"
            onClick={() => onCalculateEMI(scheme)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #ea580c',
              background: '#fff7ed',
              color: '#9a3412',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#ea580c';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#fff7ed';
              (e.currentTarget as HTMLElement).style.color = '#9a3412';
            }}
          >
            <Calculator size={14} />
            <span>Calculate EMI</span>
          </button>
        )}
      </div>

      {/* Voice / Listen Action */}
      {onPlayVoice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 8,
            borderTop: '1px solid var(--border, #f1f5f9)',
          }}
        >
          <VoiceButton
            isPlaying={!!isVoicePlaying}
            isLoading={!!isVoiceLoading}
            onPlay={onPlayVoice}
            onStop={onStopVoice || (() => {})}
            title={`Listen to ${scheme.name} details`}
          />
        </div>
      )}
    </Interactive3DCard>
  );
}
