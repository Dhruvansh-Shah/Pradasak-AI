'use client';

interface Scheme {
  name: string;
  category: string;
  max_loan_lakh: number;
  min_loan_lakh?: number;
  interest_rate_min: number;
  interest_rate_max: number;
  max_tenure_months: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_income_lakh: number;
  coverage_percent?: number;
  gender_eligibility?: string;
}

function fmt(lakh: number) {
  if (lakh >= 1) return `₹${lakh}L`;
  return `₹${(lakh * 100000).toLocaleString('en-IN')}`;
}

function rateRange(s: Scheme) {
  return s.interest_rate_min === s.interest_rate_max
    ? `${s.interest_rate_min}% p.a.`
    : `${s.interest_rate_min}–${s.interest_rate_max}% p.a.`;
}

function moratorium(s: Scheme) {
  return s.moratorium_months_min === s.moratorium_months_max
    ? `${s.moratorium_months_min} months`
    : `${s.moratorium_months_min}–${s.moratorium_months_max} months`;
}

const ROWS: { label: string; fn: (s: Scheme) => string }[] = [
  { label: 'Max Loan', fn: (s) => fmt(s.max_loan_lakh) },
  { label: 'Interest Rate', fn: rateRange },
  { label: 'Max Tenure', fn: (s) => `${s.max_tenure_months} months` },
  { label: 'Moratorium', fn: moratorium },
  { label: 'Income Limit', fn: (s) => `${fmt(s.max_income_lakh)}/yr` },
  { label: 'Coverage', fn: (s) => s.coverage_percent ? `${s.coverage_percent}%` : 'N/A' },
  { label: 'Eligibility', fn: (s) => s.gender_eligibility === 'women_only' ? '👩 Women only' : 'All SC' },
];

export default function ComparisonCard({ schemeA, schemeB }: { schemeA: Scheme; schemeB: Scheme }) {
  return (
    <div
      className="rounded-xl overflow-hidden mb-3"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="grid grid-cols-3" style={{ background: 'var(--accent)' }}>
        <div className="p-3 text-white text-xs font-medium" style={{ opacity: 0.6 }}>Feature</div>
        <div className="p-3 text-white text-xs font-bold border-l border-white/20 text-center">
          {schemeA.name.length > 22 ? schemeA.name.slice(0, 20) + '…' : schemeA.name}
        </div>
        <div className="p-3 text-white text-xs font-bold border-l border-white/20 text-center">
          {schemeB.name.length > 22 ? schemeB.name.slice(0, 20) + '…' : schemeB.name}
        </div>
      </div>

      {/* Rows */}
      {ROWS.map((row, i) => {
        const aVal = row.fn(schemeA);
        const bVal = row.fn(schemeB);
        return (
          <div
            key={i}
            className="grid grid-cols-3"
            style={{
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--background)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div className="p-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{row.label}</div>
            <div className="p-2.5 text-xs text-center border-l" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              {aVal}
            </div>
            <div className="p-2.5 text-xs text-center border-l" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              {bVal}
            </div>
          </div>
        );
      })}
    </div>
  );
}
