'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceButton from './VoiceButton';
import { buildEmiSpeech } from '@/lib/speechBuilders';
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
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fetchSchemes, fetchSchemeById, fetchTTS, Scheme } from '@/lib/api';

interface SchemePreset {
  id?: number;
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
    id: 5,
    name: 'Term Loan Scheme',
    nameHi: 'टर्म लोन योजना',
    amount: 500000,
    rate: 7,
    tenure: 60,
    moratorium: 6,
    tag: 'General Business',
  },
  {
    id: 1,
    name: 'Micro Credit Finance (MCF)',
    nameHi: 'माइक्रो क्रेडिट वित्त',
    amount: 140000,
    rate: 5,
    tenure: 36,
    moratorium: 3,
    tag: 'Micro Enterprise',
  },
  {
    id: 2,
    name: 'Mahila Samriddhi Yojana',
    nameHi: 'महिला समृद्धि योजना',
    amount: 140000,
    rate: 4,
    tenure: 36,
    moratorium: 3,
    tag: 'Women Exclusive',
  },
  {
    id: 3,
    name: 'Education Loan (General)',
    nameHi: 'शिक्षा ऋण',
    amount: 1000000,
    rate: 4,
    tenure: 84,
    moratorium: 12,
    tag: 'Professional Degrees',
  },
  {
    id: 4,
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
  const searchParams = useSearchParams();
  const schemeIdParam = searchParams ? searchParams.get('schemeId') : null;

  const { t, lang } = useLanguage();
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [dbSchemes, setDbSchemes] = useState<Scheme[]>([]);
  const [amount, setAmount] = useState<number>(500000);
  const [rate, setRate] = useState<number>(7);
  const [tenure, setTenure] = useState<number>(60);
  const [moratorium, setMoratorium] = useState<number>(6);
  const [userSalary, setUserSalary] = useState<number | null>(null);

  // Fetch db schemes
  useEffect(() => {
    fetchSchemes()
      .then((schemes) => {
        if (schemes && schemes.length > 0) {
          setDbSchemes(schemes);
        }
      })
      .catch((e) => console.warn('Failed to load schemes for EMI tab:', e));
  }, []);

  // Handle schemeId parameter
  useEffect(() => {
    if (!schemeIdParam) return;
    const numId = parseInt(schemeIdParam, 10);
    if (isNaN(numId)) return;

    fetchSchemeById(numId)
      .then((s) => {
        if (s) {
          setSelectedScheme(s);
          setAmount(s.max_loan_lakh ? Math.round(s.max_loan_lakh * 100000) : 200000);
          setRate(s.interest_rate ?? 5);
          setTenure(s.tenure_months ?? 36);
          setMoratorium(s.moratorium_months ?? 3);
          setPresetIndex(-1);
        }
      })
      .catch((err) => console.warn('Failed to fetch scheme by id:', err));
  }, [schemeIdParam]);

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
    setSelectedScheme(null);
    setAmount(p.amount);
    setRate(p.rate);
    setTenure(p.tenure);
    setMoratorium(p.moratorium);
  }

  function applyScheme(s: Scheme) {
    setSelectedScheme(s);
    setPresetIndex(-1);
    setAmount(s.max_loan_lakh ? Math.round(s.max_loan_lakh * 100000) : 200000);
    setRate(s.interest_rate ?? 5);
    setTenure(s.tenure_months ?? 36);
    setMoratorium(s.moratorium_months ?? 3);
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

  const minRate = selectedScheme?.interest_rate_min != null ? Number(selectedScheme.interest_rate_min) : 3;
  const maxRate = selectedScheme?.interest_rate_max != null ? Number(selectedScheme.interest_rate_max) : 12;
  const minTenure = (selectedScheme as any)?.min_tenure_months != null ? Number((selectedScheme as any).min_tenure_months) : 12;
  const maxTenure = (selectedScheme as any)?.max_tenure_months != null ? Number((selectedScheme as any).max_tenure_months) : 120;

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlayingVoice(false);
    setIsLoadingVoice(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const emiSpeechText = useMemo(() => {
    return buildEmiSpeech({
      scheme: selectedScheme || (presetIndex >= 0 ? { name: PRESETS[presetIndex].name } : { name: 'Loan Scheme' }),
      schemeName: selectedScheme?.name || (presetIndex >= 0 ? PRESETS[presetIndex].name : undefined),
      loanAmount: amount,
      interestRate: rate,
      tenureMonths: tenure,
      moratoriumMonths: moratorium,
      monthlyEMI: calculation.monthlyEMI,
      totalInterest: calculation.totalInterest,
      totalOutflow: calculation.totalRepaid,
    });
  }, [selectedScheme, presetIndex, amount, rate, tenure, moratorium, calculation]);

  const handlePlayVoice = useCallback(
    async (textToSpeak: string) => {
      stopAudio();
      setIsLoadingVoice(true);
      try {
        const blob = await fetchTTS(textToSpeak, lang);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => stopAudio();
        audio.onerror = () => {
          stopAudio();
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(textToSpeak);
            u.onend = () => setIsPlayingVoice(false);
            u.onerror = () => setIsPlayingVoice(false);
            setIsPlayingVoice(true);
            window.speechSynthesis.speak(u);
          }
        };
        setIsLoadingVoice(false);
        setIsPlayingVoice(true);
        await audio.play();
      } catch (err) {
        setIsLoadingVoice(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(textToSpeak);
          u.onend = () => setIsPlayingVoice(false);
          u.onerror = () => setIsPlayingVoice(false);
          setIsPlayingVoice(true);
          window.speechSynthesis.speak(u);
        }
      }
    },
    [lang, stopAudio]
  );

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

      {/* ── Prominent Selected Scheme Header Banner ──────────────────────── */}
      {selectedScheme && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
            color: '#ffffff',
            borderRadius: 18,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 6px 20px rgba(11,31,58,0.14)',
            border: '1px solid rgba(251,191,36,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(251,191,36,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="#fbbf24" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Selected Scheme Active
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              Moratorium & Loan Repayment Calculator
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {selectedScheme.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {selectedScheme.interest_rate ?? rate}% p.a.
              </span>
              <button
                onClick={() => {
                  setSelectedScheme(null);
                  applyPreset(PRESETS[0], 0);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 18,
              fontSize: 13,
              color: '#cbd5e1',
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span>
              <strong>Interest Rate:</strong> {selectedScheme.interest_rate ?? rate}% p.a.
            </span>
            <span>•</span>
            <span>
              <strong>Max Tenure:</strong> Up to {selectedScheme.tenure_months ?? tenure} months
            </span>
            <span>•</span>
            <span>
              <strong>Grace / Moratorium:</strong> {selectedScheme.moratorium_months ?? moratorium} months
            </span>
            {selectedScheme.max_loan_lakh && (
              <>
                <span>•</span>
                <span>
                  <strong>Max Loan Ceiling:</strong> ₹{selectedScheme.max_loan_lakh} Lakhs
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Scheme Presets Pills ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Select Scheme or Preset:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((p, i) => {
            const isSelected = !selectedScheme && presetIndex === i;
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
          {dbSchemes
            .filter((s) => !PRESETS.some((p) => p.name.toLowerCase() === s.name.toLowerCase()))
            .slice(0, 4)
            .map((s) => {
              const isSelected = selectedScheme?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => applyScheme(s)}
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
                  <span>{s.name}</span>
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
                    {s.interest_rate}% p.a.
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
                {Number(rate).toFixed(1)}% per annum
              </span>
            </div>

            <input
              type="range"
              min={minRate}
              max={maxRate}
              step={0.1}
              value={rate}
              onChange={(e) => {
                setRate(Number(parseFloat(e.target.value).toFixed(1)));
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
              <span>{minRate}%</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>4%–7% (NSFDC Standard)</span>
              <span>{maxRate}%</span>
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
              min={minTenure}
              max={maxTenure}
              step={1}
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
              <span>{minTenure} Mo</span>
              <span>{Math.round((minTenure + maxTenure) / 2)} Mo</span>
              <span>{maxTenure} Mo</span>
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
                {selectedScheme ? selectedScheme.name : (presetIndex >= 0 ? PRESETS[presetIndex].name : 'Custom Loan Configuration')}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <VoiceButton
                text={emiSpeechText}
                isPlaying={isPlayingVoice}
                isLoading={isLoadingVoice}
                onPlay={() => handlePlayVoice(emiSpeechText)}
                onStop={stopAudio}
                variant="glass"
                size="sm"
              />
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                {rate}% p.a.
              </div>
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

          {/* User Verified Income / Affordability Meter */}
          {userSalary != null && (
            <div
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.04em' }}>
                  Verified Income Affordability
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
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    Monthly Income: <strong>{formatINR(monthlyIncome)}</strong> • EMI is <strong>{burdenRatio}%</strong> of income.{' '}
                    <span style={{ color: isAffordable ? '#86efac' : '#fca5a5', fontWeight: 700 }}>
                      {isAffordable ? '✓ Comfortably within repayment norms (≤ 50%)' : '⚠ High debt-to-income ratio (> 50%)'}
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
                const query = selectedScheme
                  ? `I want to apply for ${selectedScheme.name} with a ₹${amount / 100000} Lakh loan at ${rate}% interest for ${tenure} months`
                  : `I want to apply for a ₹${amount / 100000} Lakh loan at ${rate}% interest for ${tenure} months`;
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
          </div>
        </div>
      </div>
    </div>
  );
}
