'use client';

import { Calculator, Calendar, Percent } from 'lucide-react';
import VoiceButton from './VoiceButton';

export interface EMIData {
  emi?: number;
  totalPayable?: number;
  totalInterest?: number;
  principal?: number;
  interestRatePct?: number;
  rate?: number;
  tenureMonths?: number;
  moratoriumMonths?: number;
  params?: { principal?: number; rate?: number; tenureMonths?: number; moratoriumMonths?: number };
  schemeName?: string;
  warning?: string;
}

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export interface EMIResultCardProps {
  data: EMIData;
  speechText?: string;
  onPlayVoice?: () => void;
  onStopVoice?: () => void;
  isVoicePlaying?: boolean;
  isVoiceLoading?: boolean;
}

export default function EMIResultCard({
  data,
  speechText,
  onPlayVoice,
  onStopVoice,
  isVoicePlaying,
  isVoiceLoading,
}: EMIResultCardProps) {
  if (!data) return null;

  const emi = data.emi ?? 0;
  const totalPayable = data.totalPayable ?? 0;
  const totalInterest = data.totalInterest ?? 0;
  const principal = data.principal ?? data.params?.principal ?? 0;
  const rate = data.interestRatePct ?? data.rate ?? data.params?.rate ?? 0;
  const tenureMonths = data.tenureMonths ?? data.params?.tenureMonths ?? 0;
  const moratoriumMonths = data.moratoriumMonths ?? data.params?.moratoriumMonths ?? 0;

  return (
    <div
      style={{
        background: 'var(--surface, #ffffff)',
        border: '1.5px solid var(--border, #e2e8f0)',
        borderRadius: 18,
        padding: '22px 24px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        color: 'var(--text)',
      }}
    >
      {/* ── Top Header with Title and Voice Button ───────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary, #64748b)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Calculator size={15} color="#ea580c" />
          <span>{data.schemeName ? `Calculated EMI: ${data.schemeName}` : 'EMI Calculation'}</span>
        </div>

        {onPlayVoice && (
          <VoiceButton
            isPlaying={!!isVoicePlaying}
            isLoading={!!isVoiceLoading}
            onPlay={onPlayVoice}
            onStop={onStopVoice || (() => {})}
            title="Listen to EMI projection"
          />
        )}
      </div>

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
        <div
          style={{
            background: 'var(--surface-container, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 12,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 2 }}>
            Principal
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
            {fmt(principal)}
          </strong>
        </div>

        <div
          style={{
            background: 'var(--surface-container, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 12,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 2 }}>
            Total Interest
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#c2410c' }}>
            {fmt(totalInterest)}
          </strong>
        </div>

        <div
          style={{
            background: 'var(--surface-container, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 12,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 2 }}>
            Total Outflow
          </span>
          <strong style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>
            {fmt(totalPayable)}
          </strong>
        </div>
      </div>

      {/* Terms Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-container, #f8fafc)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 12,
          padding: '10px 16px',
          fontSize: 12,
          color: 'var(--text-secondary, #475569)',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Percent size={13} color="#ea580c" />
          <strong>{rate}%</strong> p.a. interest
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={13} color="#0b1f3a" />
          <strong>{tenureMonths}</strong> Mo tenure
        </span>
        {moratoriumMonths > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} color="#15803d" />
            <strong>{moratoriumMonths}</strong> Mo moratorium
          </span>
        )}
      </div>
    </div>
  );
}
