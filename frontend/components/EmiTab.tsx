'use client';

import { useState } from 'react';
import EMIResultCard from './EMIResultCard';
import { Calculator, Sparkles, Percent, Calendar, RefreshCw, Layers } from 'lucide-react';

const SCHEMES = [
  { name: 'Mahila Samridhi Yojana', rate: 4, max: 1.4, defaultTenure: 36, defaultMoratorium: 3 },
  { name: 'Micro Credit Finance', rate: 5, max: 1.4, defaultTenure: 36, defaultMoratorium: 3 },
  { name: 'Term Loan Scheme', rate: 7, max: 50, defaultTenure: 60, defaultMoratorium: 6 },
  { name: 'Education Loan (Skill)', rate: 4, max: 5, defaultTenure: 60, defaultMoratorium: 6 },
  { name: 'Education Loan (Higher)', rate: 6, max: 20, defaultTenure: 84, defaultMoratorium: 12 },
];

function calcEMI(principal: number, annualRate: number, months: number, moratorium: number) {
  const P = principal;
  const r = annualRate / 100 / 12;
  const n = months;
  const m = moratorium;

  // Principal after moratorium interest accrual (simple interest)
  const P2 = P * (1 + (annualRate / 100) * (m / 12));

  const repayMonths = n - m;
  let emi: number;
  if (r === 0) {
    emi = P2 / repayMonths;
  } else {
    emi = (P2 * r * Math.pow(1 + r, repayMonths)) / (Math.pow(1 + r, repayMonths) - 1);
  }

  const totalPayment = emi * repayMonths;
  const totalInterest = totalPayment - P;

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    principal: P,
    repayMonths,
    moratoriumMonths: m,
    annualRate,
  };
}

export default function EmiTab() {
  const [principal, setPrincipal] = useState('5');
  const [rate, setRate] = useState('7');
  const [tenure, setTenure] = useState('60');
  const [moratorium, setMoratorium] = useState('6');
  const [result, setResult] = useState<ReturnType<typeof calcEMI> | null>(() =>
    calcEMI(500000, 7, 60, 6)
  );
  const [error, setError] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('Term Loan Scheme');

  function handleSchemeSelect(name: string) {
    const s = SCHEMES.find((item) => item.name === name);
    setSelectedScheme(name);
    if (s) {
      setRate(String(s.rate));
      setPrincipal(String(Math.min(Number(principal) || 5, s.max)));
      setTenure(String(s.defaultTenure));
      setMoratorium(String(s.defaultMoratorium));
      setResult(calcEMI(Math.min(Number(principal) || 5, s.max) * 100000, s.rate, s.defaultTenure, s.defaultMoratorium));
    }
  }

  function calculate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    const P = parseFloat(principal) * 100000;
    const r = parseFloat(rate);
    const t = parseInt(tenure);
    const m = parseInt(moratorium) || 0;

    if (!P || P <= 0) {
      setError('Please enter a valid loan amount');
      return;
    }
    if (r < 0 || r > 30) {
      setError('Rate must be between 0% and 30%');
      return;
    }
    if (t < 1 || t > 360) {
      setError('Tenure must be 1–360 months');
      return;
    }
    if (m < 0 || m >= t) {
      setError('Moratorium must be less than tenure duration');
      return;
    }
    setResult(calcEMI(P, r, t, m));
  }

  const emiData = result
    ? {
        emi: result.emi,
        totalPayable: result.totalPayment,
        totalInterest: result.totalInterest,
        params: {
          principal: result.principal,
          rate: result.annualRate,
          tenureMonths: result.repayMonths + result.moratoriumMonths,
          moratoriumMonths: result.moratoriumMonths,
        },
        schemeName: selectedScheme || undefined,
      }
    : null;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          <Calculator className="w-3.5 h-3.5" />
          Financial Math Engine
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] tracking-tight">
          Precision EMI &amp; Moratorium Calculator
        </h2>
        <p className="text-sm text-slate-600">
          Deterministic mathematical projections accounting for NSFDC grace periods and concessional interest rates.
        </p>
      </div>

      {/* Scheme Quick Select Chips */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Official Scheme Preset
        </span>
        <div className="flex flex-wrap gap-2">
          {SCHEMES.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSchemeSelect(s.name)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                selectedScheme === s.name
                  ? 'bg-[#0b1f3a] text-white border-[#0b1f3a] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {s.name} ({s.rate}% p.a.)
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Inputs Column */}
        <form
          onSubmit={calculate}
          className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5"
        >
          {/* Loan Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Loan Amount (in Lakhs ₹)
              </label>
              <span className="text-xs font-extrabold text-[#0b1f3a]">
                ₹{principal} Lakh
              </span>
            </div>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. 5"
              step="0.1"
              min="0.1"
              max="50"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Annual Interest Rate (%)
              </label>
              <span className="text-xs font-extrabold text-emerald-700">
                {rate}% p.a.
              </span>
            </div>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              step="0.1"
              min="0"
              max="25"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
            />
          </div>

          {/* Tenure & Moratorium in 2 cols */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                min="1"
                max="360"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Moratorium (Mo)
              </label>
              <input
                type="number"
                value={moratorium}
                onChange={(e) => setMoratorium(e.target.value)}
                min="0"
                max="36"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-3.5 text-sm font-bold shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Recalculate Projections
          </button>
        </form>

        {/* Results Column */}
        <div className="lg:col-span-6 space-y-4">
          {emiData && <EMIResultCard data={emiData} />}

          {/* Grounding Formula Explainer */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Grounded Financial Model</span>
            </div>
            <p className="leading-relaxed">
              Standard EMI formula: <code>EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ – 1)</code>.
              During the moratorium period, simple interest accrues onto the principal, and repayment is amortized across remaining months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
