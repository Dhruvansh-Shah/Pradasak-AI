'use client';

import { IndianRupee, Clock, TrendingUp, CheckCircle, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSchemeName, getLocalizedSchemeDesc } from '@/lib/translations';

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
  scheme_type?: string;
  current_official_name?: string | null;
  channel_partner_applicable?: boolean;
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
  other_programme: { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan',
  education_loan: 'Education Loan',
  entrepreneurship: 'Entrepreneurship',
  other_programme: 'Government Programme',
};

export default function SchemeCard({ scheme, onSelect, selected }: Props) {
  const { t, language } = useLanguage();
  const catInfo = CATEGORY_COLORS[scheme.category] || { color: '#003366', bg: '#eff6ff', border: '#bfdbfe' };
  const label = t(`category.${scheme.category}`, CATEGORY_LABELS[scheme.category] || scheme.category);
  const isInformational = scheme.scheme_type === 'informational' || scheme.channel_partner_applicable === false;
  const localizedName = getLocalizedSchemeName(scheme.name, language);
  const localizedDesc = getLocalizedSchemeDesc(scheme.name, scheme.description, language);

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
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isInformational ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {t('schemes.type_informational', '🔵 OTHER GOVERNMENT PROGRAMME')}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {t('schemes.type_financing', '🟢 FINANCING SCHEME')}
              </span>
            )}
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded"
              style={{ background: catInfo.bg, color: catInfo.color, border: `1px solid ${catInfo.border}` }}
            >
              {label}
            </span>
          </div>

          <h3 className="font-bold mt-1 text-base leading-tight text-primary">
            {localizedName || scheme.name}
          </h3>
        </div>
        {selected && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: catInfo.color }} />}
      </div>

      <div className="grid grid-cols-3 gap-2 my-3.5 p-2.5 rounded-lg bg-surface-container border border-outline-variant/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <IndianRupee className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">{t('schemes.max_loan', 'Max Loan')}</span>
          </div>
          <span className="text-sm font-bold text-on-surface">
            ₹{scheme.max_loan_lakh}L
          </span>
        </div>
        <div className="text-center border-x border-outline-variant/30">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">{t('schemes.interest', 'Interest')}</span>
          </div>
          <span className="text-sm font-bold text-success">
            {scheme.interest_rate_min}–{scheme.interest_rate_max}%
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">{t('schemes.tenure', 'Tenure')}</span>
          </div>
          <span className="text-sm font-bold text-on-surface">
            {Math.round(scheme.max_tenure_months / 12)}yr
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-on-surface-variant line-clamp-2">
        {localizedDesc || scheme.description}
      </p>

      {scheme.coverage_percent > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted">
          <span>{t('schemes.project_coverage', 'Project Coverage:')} <strong className="text-primary font-semibold">Up to {scheme.coverage_percent}%</strong></span>
          {scheme.moratorium_months_max > 0 && (
            <span>{t('schemes.moratorium', 'Moratorium:')} <strong className="text-primary font-semibold">{scheme.moratorium_months_max}m</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
