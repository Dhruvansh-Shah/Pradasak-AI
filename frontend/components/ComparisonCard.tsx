'use client';

import { Scale, ArrowRight, ShieldCheck, Percent, IndianRupee, Calendar } from 'lucide-react';

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
  if (lakh >= 1) return `₹${lakh} Lakh`;
  return `₹${(lakh * 100000).toLocaleString('en-IN')}`;
}

function rateRange(s: Scheme) {
  return s.interest_rate_min === s.interest_rate_max
    ? `${s.interest_rate_min}% p.a.`
    : `${s.interest_rate_min}–${s.interest_rate_max}% p.a.`;
}

function moratorium(s: Scheme) {
  return s.moratorium_months_min === s.moratorium_months_max
    ? `${s.moratorium_months_min} Months`
    : `${s.moratorium_months_min}–${s.moratorium_months_max} Months`;
}

const ROWS: { label: string; fn: (s: Scheme) => string }[] = [
  { label: 'Max Loan Limit', fn: (s) => fmt(s.max_loan_lakh) },
  { label: 'Subsidized Interest', fn: rateRange },
  { label: 'Repayment Tenure', fn: (s) => `Up to ${s.max_tenure_months} Mo` },
  { label: 'Moratorium Grace', fn: moratorium },
  { label: 'Annual Income Cap', fn: (s) => `≤ ${fmt(s.max_income_lakh)}/yr` },
  { label: 'Project Coverage', fn: (s) => (s.coverage_percent ? `Up to ${s.coverage_percent}%` : 'Standard') },
  { label: 'Gender Eligibility', fn: (s) => (s.gender_eligibility === 'women_only' ? '👩 Women Only' : 'All SC Beneficiaries') },
];

export default function ComparisonCard({ schemeA, schemeB }: { schemeA: Scheme; schemeB: Scheme }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(11,31,58,0.04)',
        width: '100%',
      }}
    >
      {/* ── Table Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.4fr 1.4fr',
          background: '#0b1f3a',
          color: '#ffffff',
          padding: '16px 20px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
          <Scale size={15} />
          <span>Feature</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, textAlign: 'center', color: '#ffffff' }}>
          {schemeA.name}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, textAlign: 'center', color: '#38bdf8' }}>
          {schemeB.name}
        </div>
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ROWS.map((row, i) => {
          const aVal = row.fn(schemeA);
          const bVal = row.fn(schemeB);
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.4fr 1.4fr',
                padding: '12px 20px',
                background: isEven ? '#ffffff' : '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 600, color: '#475569' }}>{row.label}</div>
              <div style={{ fontWeight: 700, color: '#0b1f3a', textAlign: 'center' }}>{aVal}</div>
              <div style={{ fontWeight: 700, color: '#0369a1', textAlign: 'center' }}>{bVal}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
