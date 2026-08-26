'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  Percent,
  IndianRupee,
  Calendar,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SchemePreset {
  name: string;
  nameHi: string;
  amount: number; // in Rupees
  rate: number;   // annual percentage
  tenure: number; // in months
  moratorium: number; // in months
  tag: string;
}

const PRESETS: SchemePreset[] = [
  {
    name: 'Term Loan Scheme',
    nameHi: 'टर्म लोन योजना',
    amount: 500000,
    rate: 7,
    tenure: 60,
    moratorium: 6,
    tag: 'General Business',
  },
  {
    name: 'Micro Credit Finance (MCF)',
    nameHi: 'माइक्रो क्रेडिट वित्त',
    amount: 140000,
    rate: 5,
    tenure: 36,
    moratorium: 3,
    tag: 'Micro Enterprise',
  },
  {
    name: 'Mahila Samriddhi Yojana',
    nameHi: 'महिला समृद्धि योजना',
    amount: 140000,
    rate: 4,
    tenure: 36,
    moratorium: 3,
    tag: 'Women Exclusive',
  },
  {
    name: 'Education Loan (General)',
    nameHi: 'शिक्षा ऋण',
    amount: 1000000,
    rate: 4,
    tenure: 84,
    moratorium: 12,
    tag: 'Professional Degrees',
  },
  {
    name: 'Education Loan (Vocational/Skill)',
    nameHi: 'कौशल विकास शिक्षा ऋण',
    amount: 400000,
    rate: 4,
    tenure: 48,
    moratorium: 6,
    tag: 'Skill Training',
  },
];

export default function EmiTab({ onSchemeSelect }: { onSchemeSelect?: (schemeName: string) => void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [amount, setAmount] = useState<number>(500000);
  const [rate, setRate] = useState<number>(7);
  const [tenure, setTenure] = useState<number>(60);
  const [moratorium, setMoratorium] = useState<number>(6);

  function applyPreset(p: SchemePreset, idx: number) {
    setPresetIndex(idx);
    setAmount(p.amount);
    setRate(p.rate);
    setTenure(p.tenure);
    setMoratorium(p.moratorium);
  }

  // EMI Calculation accounting for Moratorium
  const calculation = useMemo(() => {
    const P = amount;
    const annualR = rate;
    const T_total = tenure;
    const M = moratorium;

    // Repayment months after moratorium
    const n = Math.max(1, T_total - M);
    const r = annualR / 12 / 100;

    // Simple interest accrued during moratorium
    const moratoriumInterest = P * (annualR / 100) * (M / 12);
    const principalAtRepayment = P + moratoriumInterest;

    let emi = 0;
    if (r > 0) {
      emi =
        (principalAtRepayment * r * Math.pow(1 + r, n)) /
        (Math.pow(1 + r, n) - 1);
    } else {
      emi = principalAtRepayment / n;
    }

    const totalRepaid = emi * n;
    const totalInterest = totalRepaid - P;

    const principalPct = Math.round((P / (totalRepaid || 1)) * 100);
    const interestPct = 100 - principalPct;

    return {
      monthlyEMI: Math.round(emi),
      principal: P,
      moratoriumInterest: Math.round(moratoriumInterest),
      totalInterest: Math.round(totalInterest),
      totalRepaid: Math.round(totalRepaid),
      repaymentMonths: n,
      principalPct,
      interestPct,
    };
  }, [amount, rate, tenure, moratorium]);

  function formatINR(val: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  }

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '16px 20px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        width: '100%',
      }}
    >
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calculator size={16} color="#ea580c" />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#c2410c',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('emi.badge', 'NSFDC Financial Math Engine')}
          </span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
          {t('emi.title', 'Precision EMI & Moratorium Calculator')}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          {t('emi.desc', 'Simulate official concessional schemes with exact interest rates and repayment grace periods (3–12 months).')}
        </p>
      </div>

      {/* ── Scheme Presets Pills ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick Preset Schemes:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((p, i) => {
            const isSelected = presetIndex === i;
            return (
              <button
                key={p.name}
                onClick={() => applyPreset(p, i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #0b1f3a' : '1.5px solid #e2e8f0',
                  background: isSelected ? '#0b1f3a' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  boxShadow: isSelected ? '0 2px 8px rgba(11,31,58,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 150ms ease',
                }}
              >
                <span>{p.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: isSelected ? 'rgba(251,191,36,0.25)' : '#f1f5f9',
                    color: isSelected ? '#fbbf24' : '#64748b',
                  }}
                >
                  {p.rate}% p.a.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* ── Left Column: Interactive Sliders & Inputs ─────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '26px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Loan Parameters
            </span>
            <button
              onClick={() => applyPreset(PRESETS[0], 0)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 600,
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Loan Amount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={14} color="#0b1f3a" />
                <span>Loan Required</span>
              </label>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a' }}>
                {formatINR(amount)}
              </span>
            </div>

            <input
              type="range"
              min={50000}
              max={5000000}
              step={25000}
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setPresetIndex(-1);
              }}
              style={{
                width: '100%',
                accentColor: '#e87722',
                cursor: 'pointer',
                height: 6,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>₹50,000 (Min)</span>
              <span>₹25 Lakh</span>
              <span>₹50 Lakh (Max)</span>
            </div>
          </div>

          {/* 2. Subsidized Interest Rate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Percent size={14} color="#0b1f3a" />
                <span>Interest Rate (Subsidized)</span>
              </label>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#c2410c' }}>
                {rate}% per annum
              </span>
            </div>

            <input
              type="range"
              min={3}
              max={12}
              step={0.5}
              value={rate}
              onChange={(e) => {
                setRate(Number(e.target.value));
                setPresetIndex(-1);
              }}
              style={{
                width: '100%',
                accentColor: '#e87722',
                cursor: 'pointer',
                height: 6,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>3%</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>4%–7% (NSFDC Standard)</span>
              <span>12%</span>
            </div>
          </div>

          {/* 3. Total Loan Tenure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#0b1f3a" />
                <span>Total Loan Tenure</span>
              </label>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a' }}>
                {tenure} Months ({Math.round(tenure / 12)} Years)
              </span>
            </div>

            <input
              type="range"
              min={12}
              max={120}
              step={6}
              value={tenure}
              onChange={(e) => {
                setTenure(Number(e.target.value));
                setPresetIndex(-1);
              }}
              style={{
                width: '100%',
                accentColor: '#e87722',
                cursor: 'pointer',
                height: 6,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>1 Year (12 Mo)</span>
              <span>5 Years (60 Mo)</span>
              <span>10 Years (120 Mo)</span>
            </div>
          </div>

          {/* 4. Moratorium Grace Period */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#0b1f3a" />
                <span>Moratorium (Grace Period)</span>
              </label>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#c2410c' }}>
                {moratorium === 0 ? 'No Grace Period' : `${moratorium} Months`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[0, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMoratorium(m)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: moratorium === m ? 700 : 500,
                    border: moratorium === m ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                    background: moratorium === m ? '#0b1f3a' : '#f8fafc',
                    color: moratorium === m ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {m === 0 ? '0 Mo' : `${m} Mo`}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              During moratorium, simple interest accrues onto the principal before repayment begins.
            </p>
          </div>
        </div>

        {/* ── Right Column: Calculated EMI Result Showcase ─────────────────── */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0b1f3a, #132e54)',
            color: '#ffffff',
            borderRadius: 20,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            boxShadow: '0 8px 30px rgba(11,31,58,0.22)',
            position: 'sticky',
            top: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 14 }}>
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Estimated Repayment Plan
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '2px 0 0' }}>
                {presetIndex >= 0 ? PRESETS[presetIndex].name : 'Custom Loan Configuration'}
              </h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
              {rate}% p.a.
            </div>
          </div>

          {/* Big Monthly EMI Hero Number */}
          <div
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              Monthly Instalment (EMI)
            </span>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em' }}>
              {formatINR(calculation.monthlyEMI)}
            </div>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
              for {calculation.repaymentMonths} months (after {moratorium} mo moratorium)
            </span>
          </div>

          {/* Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 2 }}>Principal</span>
              <strong style={{ fontSize: 13, color: '#ffffff' }}>{formatINR(calculation.principal)}</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 2 }}>Total Interest</span>
              <strong style={{ fontSize: 13, color: '#fed7aa' }}>{formatINR(calculation.totalInterest)}</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 2 }}>Total Outflow</span>
              <strong style={{ fontSize: 13, color: '#86efac' }}>{formatINR(calculation.totalRepaid)}</strong>
            </div>
          </div>

          {/* Ratio Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              <span>Principal: {calculation.principalPct}%</span>
              <span>Interest: {calculation.interestPct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${calculation.principalPct}%`, background: '#38bdf8' }} />
              <div style={{ width: `${calculation.interestPct}%`, background: '#fb923c' }} />
            </div>
          </div>

          {/* Action Triggers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => router.push(`/chat?q=I want to apply for a ₹${amount / 100000} Lakh loan at ${rate}% interest for ${tenure} months`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #e87722, #d36513)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(232,119,34,0.3)',
                transition: 'all 150ms ease',
              }}
            >
              <Sparkles size={16} />
              <span>Inquire This Loan with AI</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => router.push('/partners')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '11px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <MapPin size={14} color="#fbbf24" />
              <span>Find Nearest Channel Partner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
