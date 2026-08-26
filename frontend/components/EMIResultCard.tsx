'use client';

import { Calculator, Calendar, Percent } from 'lucide-react';

interface EMIData {
  emi?: number;
  totalPayable?: number;
  totalInterest?: number;
  params?: { principal?: number; rate?: number; tenureMonths?: number; moratoriumMonths?: number };
  schemeName?: string;
}

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function EMIResultCard({ data }: { data: EMIData }) {
  if (!data) return null;

  const emi = data.emi ?? 0;
  const totalPayable = data.totalPayable ?? 0;
  const totalInterest = data.totalInterest ?? 0;
  const params = data.params || {};
  const principal = params.principal ?? 0;
  const rate = params.rate ?? 0;
  const tenureMonths = params.tenureMonths ?? 0;
  const moratoriumMonths = params.moratoriumMonths ?? 0;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '22px 24px',
        boxShadow: '0 2px 10px rgba(11,31,58,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      {data.schemeName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Calculator size={15} color="#ea580c" />
          <span>Calculated EMI for: {data.schemeName}</span>
        </div>
      )}

      {/* Hero Highlight */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
          color: '#ffffff',
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(11,31,58,0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
          Estimated Monthly Instalment
        </span>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em' }}>
          {fmt(emi)}
        </div>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
          per month after moratorium grace period
        </span>
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
            Principal
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {fmt(principal)}
          </strong>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
            Total Interest
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#c2410c' }}>
            {fmt(totalInterest)}
          </strong>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
            Total Outflow
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>
            {fmt(totalPayable)}
          </strong>
        </div>
      </div>

      {/* Terms Bar */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#1e40af', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Percent size={14} color="#2563eb" />
          <span>{rate}% per annum</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Calendar size={14} color="#2563eb" />
          <span>{tenureMonths} Months Total</span>
        </div>

        {moratoriumMonths > 0 && (
          <div style={{ fontWeight: 700, color: '#9a3412', background: '#ffedd5', padding: '2px 8px', borderRadius: 6 }}>
            {moratoriumMonths} Mo Moratorium
          </div>
        )}
      </div>
    </div>
  );
}
