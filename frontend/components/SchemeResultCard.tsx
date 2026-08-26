'use client';

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

const CATEGORY_COLORS: Record<string, string> = {
  micro_finance: '#10b981',
  term_loan: '#3b82f6',
  education_loan: '#8b5cf6',
  entrepreneurship: '#f59e0b',
  skill_development: '#ec4899',
  other_financial_assistance: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
  skill_development: 'Skill Development',
};

function fmt(rs: number) {
  if (rs >= 100000) return `₹${(rs / 100000).toFixed(1)}L`;
  if (rs >= 1000) return `₹${(rs / 1000).toFixed(0)}K`;
  return `₹${rs}`;
}

interface Props {
  scheme: Scheme;
  onCalculateEMI?: (scheme: Scheme) => void;
  onFindPartners?: () => void;
  rank?: number;
}

export default function SchemeResultCard({ scheme, onCalculateEMI, onFindPartners, rank }: Props) {
  const color = CATEGORY_COLORS[scheme.category] || '#6b7280';
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          {rank === 1 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mt-0.5" style={{ background: '#f59e0b' }}>
              ⭐ Best Match
            </span>
          )}
          <div>
            <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
              {scheme.name}
            </h3>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: color + '1a', color }}
        >
          {label}
        </span>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Max Loan</div>
          <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {fmt(scheme.max_loan_lakh * 100000)}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Interest</div>
          <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {scheme.interest_rate_min === scheme.interest_rate_max
              ? `${scheme.interest_rate_min}%`
              : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Income Limit</div>
          <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {fmt(scheme.max_income_lakh * 100000)}/yr
          </div>
        </div>
      </div>

      {/* Match reasons */}
      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
        <div className="mb-2">
          {scheme.matchReasons.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs mb-1" style={{ color: '#10b981' }}>
              <span className="mt-0.5">✓</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {scheme.warnings && scheme.warnings.length > 0 && (
        <div className="mb-2">
          {scheme.warnings.slice(0, 1).map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs mb-1" style={{ color: '#f59e0b' }}>
              <span className="mt-0.5">⚠</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Additional info */}
      <div className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
        Tenure: up to {scheme.max_tenure_months} months · Moratorium: {scheme.moratorium_months_min}–{scheme.moratorium_months_max} months
        {scheme.gender_eligibility === 'women_only' && ' · 👩 Women only'}
      </div>

      {/* Actions */}
      {(onCalculateEMI || onFindPartners) && (
        <div className="flex gap-2">
          {onCalculateEMI && (
            <button
              onClick={() => onCalculateEMI(scheme)}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg font-medium border transition-colors"
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                background: 'transparent',
              }}
            >
              Calculate EMI
            </button>
          )}
          {onFindPartners && (
            <button
              onClick={onFindPartners}
              className="flex-1 text-xs py-1.5 px-3 rounded-lg font-medium text-white transition-opacity"
              style={{ background: 'var(--accent)' }}
            >
              Find Partners
            </button>
          )}
        </div>
      )}
    </div>
  );
}
