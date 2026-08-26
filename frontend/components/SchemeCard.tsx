'use client';

import { IndianRupee, Clock, TrendingUp, CheckCircle } from 'lucide-react';

interface Scheme {
  id: number;
  name: string;
  category: string;
  description: string;
  max_income_lakh: number;
  min_loan_lakh: number;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  coverage_percent: number;
  eligible_project_types: string[];
  notes: string;
}

interface Props {
  scheme: Scheme;
  onSelect?: (scheme: Scheme) => void;
  selected?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  micro_finance: '#059669',
  term_loan: '#1a56db',
  education_loan: '#7c3aed',
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
};

export default function SchemeCard({ scheme, onSelect, selected }: Props) {
  const color = CATEGORY_COLORS[scheme.category] || '#6b7280';
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <div
      className="rounded-xl border p-4 cursor-pointer transition-all"
      style={{
        background: 'var(--surface)',
        borderColor: selected ? color : 'var(--border)',
        boxShadow: selected ? `0 0 0 2px ${color}30` : 'none',
      }}
      onClick={() => onSelect?.(scheme)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}
          >
            {label}
          </span>
          <h3 className="font-semibold mt-1 text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
            {scheme.name}
          </h3>
        </div>
        {selected && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color }} />}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <IndianRupee className="w-3 h-3" style={{ color: 'var(--muted)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Max Loan</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            ₹{scheme.max_loan_lakh}L
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" style={{ color: 'var(--muted)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Interest</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {scheme.interest_rate_min}–{scheme.interest_rate_max}%
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3" style={{ color: 'var(--muted)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Tenure</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {Math.round(scheme.max_tenure_months / 12)}yr
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
        {scheme.description}
      </p>

      {onSelect && (
        <button
          className="mt-3 w-full text-xs font-medium py-1.5 rounded-lg transition-colors"
          style={{ background: `${color}15`, color }}
        >
          {selected ? 'Selected — use for EMI & Partner search' : 'Select this scheme'}
        </button>
      )}
    </div>
  );
}
