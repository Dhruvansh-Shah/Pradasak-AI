'use client';

import { CheckCircle2, AlertTriangle, ArrowRight, Calculator, MapPin, Sparkles } from 'lucide-react';

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
  micro_finance:    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  term_loan:        { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  education_loan:   { bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200' },
  entrepreneurship: { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  skill_development:{ bg: 'bg-pink-50',    text: 'text-pink-800',    border: 'border-pink-200' },
  default:          { bg: 'bg-slate-50',   text: 'text-slate-800',   border: 'border-slate-200' },
};

const CATEGORY_LABELS: Record<string, string> = {
  micro_finance: 'Micro Finance',
  term_loan: 'Term Loan Scheme',
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
  const meta = CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.default;
  const label = CATEGORY_LABELS[scheme.category] || scheme.category;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {rank === 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                <Sparkles className="w-3 h-3" /> Best Match
              </span>
            )}
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
              {label}
            </span>
          </div>
          <h3 className="font-extrabold text-base text-slate-900 leading-snug">
            {scheme.name}
          </h3>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Max Loan
          </div>
          <div className="text-sm sm:text-base font-extrabold text-[#0b1f3a]">
            {fmt(scheme.max_loan_lakh * 100000)}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Interest Rate
          </div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700">
            {scheme.interest_rate_min === scheme.interest_rate_max
              ? `${scheme.interest_rate_min}% p.a.`
              : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Income Cap
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-700">
            ≤ {fmt(scheme.max_income_lakh * 100000)}
          </div>
        </div>
      </div>

      {/* Description Snippet */}
      {scheme.description && (
        <p className="text-xs text-slate-600 leading-relaxed">
          {scheme.description}
        </p>
      )}

      {/* Match Reasons */}
      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {scheme.matchReasons.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {scheme.warnings && scheme.warnings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {scheme.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Parameters Tag */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="bg-slate-100 px-2 py-0.5 rounded">Tenure: Up to {scheme.max_tenure_months} mo</span>
        <span className="bg-slate-100 px-2 py-0.5 rounded">Moratorium: {scheme.moratorium_months_min}–{scheme.moratorium_months_max} mo</span>
        {scheme.gender_eligibility === 'women_only' && (
          <span className="bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded">Women Exclusive</span>
        )}
      </div>

      {/* Actions */}
      {(onCalculateEMI || onFindPartners) && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          {onCalculateEMI && (
            <button
              onClick={() => onCalculateEMI(scheme)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-300 hover:border-[#0b1f3a] text-[#0b1f3a] bg-white hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              Calculate EMI
            </button>
          )}

          {onFindPartners && (
            <button
              onClick={onFindPartners}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-[#0b1f3a] hover:bg-[#132e54] text-white transition-all shadow-xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Find Partners
            </button>
          )}
        </div>
      )}
    </div>
  );
}
