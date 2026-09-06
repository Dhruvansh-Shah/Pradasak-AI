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
  RotateCcw,
  Building2,
  User,
  ShieldAlert,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Award,
  Coins,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export type BorrowerMode = 'individual' | 'msme';

interface SchemePreset {
  name: string;
  nameHi: string;
  amount: number; // in Rupees
  rate: number;   // annual percentage
  tenure: number; // in months
  moratorium: number; // in months
  tag: string;
  recommendedMode?: BorrowerMode;
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
    recommendedMode: 'individual',
  },
  {
    name: 'Micro Credit Finance (MCF)',
    nameHi: 'माइक्रो क्रेडिट वित्त',
    amount: 140000,
    rate: 5,
    tenure: 36,
    moratorium: 3,
    tag: 'Micro Enterprise',
    recommendedMode: 'individual',
  },
  {
    name: 'Mahila Samriddhi Yojana',
    nameHi: 'महिला समृद्धि योजना',
    amount: 140000,
    rate: 4,
    tenure: 36,
    moratorium: 3,
    tag: 'Women Exclusive',
    recommendedMode: 'individual',
  },
  {
    name: 'MSME Unit Setup / Term Loan',
    nameHi: 'एमएसएमई इकाई स्थापना',
    amount: 2500000,
    rate: 7.5,
    tenure: 84,
    moratorium: 12,
    tag: 'Registered MSME',
    recommendedMode: 'msme',
  },
  {
    name: 'Education Loan (General)',
    nameHi: 'शिक्षा ऋण',
    amount: 1000000,
    rate: 4,
    tenure: 84,
    moratorium: 12,
    tag: 'Professional Degrees',
    recommendedMode: 'individual',
  },
  {
    name: 'Vocational Education Loan',
    nameHi: 'कौशल विकास शिक्षा ऋण',
    amount: 400000,
    rate: 4,
    tenure: 48,
    moratorium: 6,
    tag: 'Skill Training',
    recommendedMode: 'individual',
  },
];

export default function EmiTab({ onSchemeSelect }: { onSchemeSelect?: (schemeName: string) => void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [borrowerMode, setBorrowerMode] = useState<BorrowerMode>('individual');
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [amount, setAmount] = useState<number>(500000);
  const [rate, setRate] = useState<number>(7);
  const [tenure, setTenure] = useState<number>(60);
  const [moratorium, setMoratorium] = useState<number>(6);
  const [userSalary, setUserSalary] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('auth_user');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.salary != null && !isNaN(Number(parsed.salary))) {
            setUserSalary(Number(parsed.salary));
          }
        }
      } catch {}
    }
  }, []);

  function applyPreset(p: SchemePreset, idx: number) {
    setPresetIndex(idx);
    setAmount(p.amount);
    setRate(p.rate);
    setTenure(p.tenure);
    setMoratorium(p.moratorium);
    if (p.recommendedMode) {
      setBorrowerMode(p.recommendedMode);
    }
  }

  // Full Dual-Mode and Moratorium Calculation
  const calculation = useMemo(() => {
    const P = amount;
    const annualR = rate;
    const T_total = tenure;
    const M = moratorium;
    const isMsme = borrowerMode === 'msme';

    // 1. Dual-Mode Margin Money (Individual: 5% margin / 95% loan; MSME: 10% margin / 90% loan)
    const promoterMarginPercent = isMsme ? 10 : 5;
    const loanFundingPercent = isMsme ? 90 : 95;
    const totalProjectOutlay = Math.round(P / (loanFundingPercent / 100));
    const promoterContribution = Math.round(totalProjectOutlay - P);
    const cgtmseEligible = isMsme;
    const cgtmseBadge = isMsme
      ? 'CGTMSE Eligible: Collateral-Free Credit Guarantee (up to ₹5 Crore)'
      : null;

    // 2. Moratorium Simple Interest Accrual & Capitalization
    const n = Math.max(1, T_total - M);
    const r = annualR / 12 / 100;
    const moratoriumInterest = Math.round(P * (annualR / 100) * (M / 12));
    const principalAtRepayment = P + moratoriumInterest;

    let emi = 0;
    if (r > 0) {
      emi = Math.round(
        (principalAtRepayment * r * Math.pow(1 + r, n)) /
          (Math.pow(1 + r, n) - 1)
      );
    } else {
      emi = Math.round(principalAtRepayment / n);
    }

    const totalRepaid = emi * n;
    const totalInterest = totalRepaid - P;

    const principalPct = Math.round((P / (totalRepaid || 1)) * 100);
    const interestPct = 100 - principalPct;

    // 3. Informal Moneylender Comparison (36% APR Compounding)
    const informalAnnualRate = 36;
    const informalMonthlyRate = informalAnnualRate / 12 / 100;
    const informalMonthlyEMI = Math.round(
      (P * informalMonthlyRate * Math.pow(1 + informalMonthlyRate, T_total)) /
        (Math.pow(1 + informalMonthlyRate, T_total) - 1)
    );
    const informalTotalRepaid = informalMonthlyEMI * T_total;
    const informalTotalInterest = informalTotalRepaid - P;
    const netWealthPreserved = Math.max(0, informalTotalInterest - totalInterest);

    // 4. Amortization Schedule
    const schedule: { month: number; emi: number; principalPaid: number; interestPaid: number; remainingBalance: number; isMoratorium: boolean }[] = [];
    let balance = P;

    if (M > 0) {
      const monthlyAccrued = moratoriumInterest / M;
      for (let m = 1; m <= M; m++) {
        balance += monthlyAccrued;
        schedule.push({
          month: m,
          emi: 0,
          principalPaid: 0,
          interestPaid: Math.round(monthlyAccrued),
          remainingBalance: Math.round(balance),
          isMoratorium: true,
        });
      }
    }

    let amortBalance = principalAtRepayment;
    for (let m = M + 1; m <= T_total; m++) {
      const interestForMonth = amortBalance * r;
      const principalPaid = Math.min(amortBalance, emi - interestForMonth);
      amortBalance = Math.max(0, amortBalance - principalPaid);
      schedule.push({
        month: m,
        emi,
        principalPaid: Math.round(principalPaid),
        interestPaid: Math.round(interestForMonth),
        remainingBalance: Math.round(amortBalance),
        isMoratorium: false,
      });
    }

    return {
      monthlyEMI: emi,
      principal: P,
      moratoriumInterest,
      principalAtRepayment,
      totalInterest,
      totalRepaid,
      repaymentMonths: n,
      principalPct,
      interestPct,
      promoterMarginPercent,
      loanFundingPercent,
      totalProjectOutlay,
      promoterContribution,
      cgtmseEligible,
      cgtmseBadge,
      informalRate: informalAnnualRate,
      informalMonthlyEMI,
      informalTotalRepaid,
      informalTotalInterest,
      netWealthPreserved,
      schedule,
    };
  }, [amount, rate, tenure, moratorium, borrowerMode]);

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
        maxWidth: 1080,
        margin: '0 auto',
        padding: '16px 20px 60px',
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
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calculator size={18} color="#ea580c" />
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
            {t('emi.badge', 'NSFDC Financial Math Engine • Dual-Mode')}
          </span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
          {t('emi.title', 'Precision EMI, Moratorium & MSME Financial Planner')}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          {t('emi.desc', 'Simulate official concessional schemes with exact promoter margin contributions, moratorium grace periods, and debt-trap protection metrics.')}
        </p>
      </div>

      {/* ── Borrower Mode Toggle (Story 3.1: Individual vs Registered MSME) ─── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 16,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0b1f3a' }}>
            Borrower Classification & Legal Structure
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Determines promoter margin equity (5% vs 10%) and CGTMSE credit guarantee qualification.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => {
              setBorrowerMode('individual');
              if (amount > 2000000) setAmount(1500000);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: borrowerMode === 'individual' ? 800 : 600,
              cursor: 'pointer',
              background: borrowerMode === 'individual' ? '#ffffff' : 'transparent',
              color: borrowerMode === 'individual' ? '#0f172a' : '#64748b',
              border: borrowerMode === 'individual' ? '1px solid #cbd5e1' : 'none',
              boxShadow: borrowerMode === 'individual' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms ease',
            }}
          >
            <User size={14} color={borrowerMode === 'individual' ? '#e87722' : '#64748b'} />
            <span>Individual Entrepreneur (5% Margin)</span>
          </button>

          <button
            onClick={() => setBorrowerMode('msme')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: borrowerMode === 'msme' ? 800 : 600,
              cursor: 'pointer',
              background: borrowerMode === 'msme' ? '#0b1f3a' : 'transparent',
              color: borrowerMode === 'msme' ? '#ffffff' : '#64748b',
              border: borrowerMode === 'msme' ? '1px solid #0b1f3a' : 'none',
              boxShadow: borrowerMode === 'msme' ? '0 2px 6px rgba(11,31,58,0.2)' : 'none',
              transition: 'all 150ms ease',
            }}
          >
            <Building2 size={14} color={borrowerMode === 'msme' ? '#fbbf24' : '#64748b'} />
            <span>Registered MSME / Enterprise (10% Margin)</span>
          </button>
        </div>
      </div>

      {/* ── CGTMSE Collateral-Free Badge (If MSME mode) ────────────────────── */}
      {calculation.cgtmseEligible && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 8px rgba(5,150,105,0.06)',
          }}
        >
          <ShieldCheck size={22} color="#059669" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {calculation.cgtmseBadge}
            </div>
            <p style={{ fontSize: 12.5, color: '#047857', margin: 0, lineHeight: 1.4 }}>
              Registered MSME units are eligible for collateral-free sanction under CGTMSE. No third-party guarantor or landed property mortgage required for loans up to ₹50 Lakh.
            </p>
          </div>
        </div>
      )}

      {/* ── Scheme Presets Pills ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick Scheme Presets:
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
            gap: 22,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Loan Parameters & Outlay
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

          {/* 1. Loan Amount Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={14} color="#0b1f3a" />
                <span>Requested Loan Amount (NSFDC Share)</span>
              </label>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#0b1f3a' }}>
                {formatINR(amount)}
              </span>
            </div>

            <input
              type="range"
              min={50000}
              max={borrowerMode === 'msme' ? 5000000 : 2500000}
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
              <span>₹1.4L (MCF)</span>
              <span>{borrowerMode === 'msme' ? '₹50 Lakh (Max MSME)' : '₹25 Lakh (Max)'}</span>
            </div>
          </div>

          {/* Project Cost & Equity Margin Breakdown Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
                Total Project Cost & Promoter Margin Breakdown
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7' }}>
                {calculation.loanFundingPercent}% / {calculation.promoterMarginPercent}% Split
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
              <div style={{ background: '#ffffff', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>Total Project Cost</span>
                <strong style={{ fontSize: 12.5, color: '#0b1f3a' }}>{formatINR(calculation.totalProjectOutlay)}</strong>
              </div>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 10, color: '#1e40af', display: 'block' }}>NSFDC Loan ({calculation.loanFundingPercent}%)</span>
                <strong style={{ fontSize: 12.5, color: '#1e40af' }}>{formatINR(amount)}</strong>
              </div>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: 8, border: '1px solid #fde68a' }}>
                <span style={{ fontSize: 10, color: '#92400e', display: 'block' }}>Your Margin ({calculation.promoterMarginPercent}%)</span>
                <strong style={{ fontSize: 12.5, color: '#92400e' }}>{formatINR(calculation.promoterContribution)}</strong>
              </div>
            </div>
          </div>

          {/* 2. Subsidized Interest Rate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Percent size={14} color="#0b1f3a" />
                <span>Interest Rate (Concessional Subsidized)</span>
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

          {/* 4. Moratorium Grace Period (Story 3.2) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#0b1f3a" />
                <span>Moratorium Grace Period</span>
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

            {moratorium > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#78350f', lineHeight: 1.45 }}>
                <strong>Simple Interest Accrual:</strong> Simple interest of <strong>{formatINR(calculation.moratoriumInterest)}</strong> accrues during the first {moratorium} months, capitalizing repayment principal to <strong>{formatINR(calculation.principalAtRepayment)}</strong> spread equally over the remaining {calculation.repaymentMonths} months.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Calculated EMI Result Showcase ─────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'sticky',
            top: 20,
          }}
        >
          {/* Main Repayment Card */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0b1f3a, #132e54)',
              color: '#ffffff',
              borderRadius: 20,
              padding: '26px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 8px 30px rgba(11,31,58,0.22)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {borrowerMode === 'msme' ? 'MSME Enterprise Plan' : 'Individual Entrepreneur Plan'}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '2px 0 0' }}>
                  {presetIndex >= 0 ? PRESETS[presetIndex].name : 'Custom Loan Schedule'}
                </h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                {rate}% p.a.
              </div>
            </div>

            {/* Monthly EMI Hero Box */}
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
                for {calculation.repaymentMonths} months (months {moratorium + 1}–{tenure})
              </span>
            </div>

            {/* Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 2 }}>Loan Principal</span>
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

            {/* Verified Income Affordability */}
            {userSalary != null && (
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.04em' }}>
                    Income Affordability
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                    {formatINR(userSalary)}/yr
                  </span>
                </div>
                {(() => {
                  const monthlyIncome = Math.round(userSalary / 12);
                  const burdenRatio = Math.round((calculation.monthlyEMI / (monthlyIncome || 1)) * 100);
                  const isAffordable = burdenRatio <= 50;
                  return (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                      Monthly Income: <strong>{formatINR(monthlyIncome)}</strong> • EMI is <strong>{burdenRatio}%</strong> of income.{' '}
                      <span style={{ color: isAffordable ? '#86efac' : '#fca5a5', fontWeight: 700 }}>
                        {isAffordable ? '✓ Within repayment norms (≤ 50%)' : '⚠ High debt-to-income ratio (> 50%)'}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action Triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              <button
                onClick={() => {
                  const query = `I want to apply for a ₹${amount / 100000} Lakh loan at ${rate}% interest for ${tenure} months under ${borrowerMode === 'msme' ? 'MSME' : 'Individual'} mode`;
                  if (onSchemeSelect) {
                    onSchemeSelect(query);
                  } else {
                    router.push(`/chat?tab=chat&q=${encodeURIComponent(query)}`);
                  }
                }}
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

              <button
                onClick={() => setShowSchedule(!showSchedule)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px dashed rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showSchedule ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{showSchedule ? 'Hide Full Amortization Schedule' : `View ${tenure}-Month Amortization Schedule`}</span>
              </button>
            </div>
          </div>

          {/* ── Story 3.3: FinTech Literacy & Moneylender Debt-Trap Shield Card ── */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #bbf7d0',
              borderRadius: 18,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 4px 14px rgba(21,128,61,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={16} color="#15803d" />
              </div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#15803d', letterSpacing: '0.04em' }}>
                  FinTech Literacy • Debt-Trap Shield
                </span>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Concessional vs. Informal Moneylender
                </h4>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 12px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block' }}>
                  NSFDC Concessional ({rate}% APR)
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#15803d', margin: '2px 0' }}>
                  {formatINR(calculation.totalInterest)}
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Total interest over {tenure} months
                </span>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 12px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#991b1b', display: 'block' }}>
                  Informal Moneylender (36% APR)
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c', margin: '2px 0' }}>
                  {formatINR(calculation.informalTotalInterest)}
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Compound debt burden
                </span>
              </div>
            </div>

            <div
              style={{
                background: '#ecfdf5',
                border: '1.5px solid #86efac',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block' }}>
                  Net Family Wealth Preserved
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#15803d' }}>
                  {formatINR(calculation.netWealthPreserved)}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#047857', background: '#dcfce7', padding: '4px 10px', borderRadius: 20 }}>
                🛡️ Shielded
              </span>
            </div>

            <p style={{ fontSize: 11.5, color: '#475569', margin: 0, lineHeight: 1.4 }}>
              Informal local moneylenders compound high interest monthly, trapping marginalized households in generational debt. Concessional government credit preserves up to <strong>{formatINR(calculation.netWealthPreserved)}</strong> inside your family business.
            </p>
          </div>
        </div>
      </div>

      {/* ── Collapsible Month-by-Month Amortization Schedule Table ──────────── */}
      {showSchedule && (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 18,
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>
                Month-by-Month Amortization Breakdown ({tenure} Months)
              </h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Months 1–{moratorium} grace period (₹0 repayment), Months {moratorium + 1}–{tenure} equal monthly installments.
              </span>
            </div>
            <button
              onClick={() => setShowSchedule(false)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Close Table
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Month</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Phase</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>EMI Paid</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>Principal Paid</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>Interest Accrued</th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>Ending Balance</th>
                </tr>
              </thead>
              <tbody>
                {calculation.schedule.map((row) => (
                  <tr
                    key={row.month}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: row.isMoratorium ? '#fffbeb' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>
                      Month {row.month}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'left' }}>
                      {row.isMoratorium ? (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>
                          Grace Period
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                          Repayment
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {formatINR(row.emi)}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#334155' }}>
                      {formatINR(row.principalPaid)}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#ea580c' }}>
                      {formatINR(row.interestPaid)}
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0b1f3a' }}>
                      {formatINR(row.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
