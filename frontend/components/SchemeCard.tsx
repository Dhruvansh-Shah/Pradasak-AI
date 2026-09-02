'use client';

import { IndianRupee, Clock, TrendingUp, CheckCircle, Award } from 'lucide-react';

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

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  micro_finance: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  term_loan: { color: '#003366', bg: '#eff6ff', border: '#bfdbfe' },
  education_loan: { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  entrepreneurship: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
};

export default function SchemeCard({ scheme, onSelect, selected }: Props) {
  const catInfo = CATEGORY_COLORS[scheme.category] || { color: '#003366', bg: '#eff6ff', border: '#bfdbfe' };
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <div
      className="card-3d p-5 cursor-pointer transition-transform hover:-translate-y-1"
      style={{
        background: '#ffffff',
        border: selected ? `2px solid ${catInfo.color}` : '1px solid #e4e2e1',
        borderRadius: 12,
        boxShadow: selected ? `0 12px 28px -6px ${catInfo.color}30, 0 0 0 1px ${catInfo.color}` : '0 2px 8px rgba(0, 30, 64, 0.04)',
      }}
      onClick={() => onSelect?.(scheme)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded"
            style={{ background: catInfo.bg, color: catInfo.color, border: `1px solid ${catInfo.border}` }}
          >
            {label}
          </span>
          <h3 className="font-bold mt-1.5 text-base leading-tight text-primary">
            {scheme.name}
          </h3>
        </div>
        {selected && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: catInfo.color }} />}
      </div>

      <div className="grid grid-cols-3 gap-2 my-3.5 p-2.5 rounded-lg bg-surface-container border border-outline-variant/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <IndianRupee className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">Max Loan</span>
          </div>
          <span className="text-sm font-bold text-on-surface">
            ₹{scheme.max_loan_lakh}L
          </span>
        </div>
        <div className="text-center border-x border-outline-variant/30">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">Interest</span>
          </div>
          <span className="text-sm font-bold text-success">
            {scheme.interest_rate_min}–{scheme.interest_rate_max}%
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">Tenure</span>
          </div>
          <span className="text-sm font-bold text-on-surface">
            {Math.round(scheme.max_tenure_months / 12)}yr
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-on-surface-variant line-clamp-2">
        {scheme.description}
      </p>

      {scheme.coverage_percent > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted">
          <span>Project Coverage: <strong className="text-primary font-semibold">Up to {scheme.coverage_percent}%</strong></span>
          {scheme.moratorium_months_max > 0 && (
            <span>Moratorium: <strong className="text-primary font-semibold">{scheme.moratorium_months_max}m</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
