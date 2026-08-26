'use client';

import { useState } from 'react';
import EMIResultCard from './EMIResultCard';

const SCHEMES = [
  { name: 'Mahila Samridhi Yojana', rate: 7, max: 1.4, cat: 'micro' },
  { name: 'Micro Credit Finance', rate: 7, max: 1.4, cat: 'micro' },
  { name: 'Term Loan', rate: 8, max: 50, cat: 'term' },
  { name: 'Education Loan (Skill)', rate: 4, max: 5, cat: 'edu' },
  { name: 'Education Loan (Higher)', rate: 6, max: 20, cat: 'edu' },
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
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('8');
  const [tenure, setTenure] = useState('60');
  const [moratorium, setMoratorium] = useState('0');
  const [result, setResult] = useState<ReturnType<typeof calcEMI> | null>(null);
  const [error, setError] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');

  function handleSchemeSelect(name: string) {
    const s = SCHEMES.find(s => s.name === name);
    setSelectedScheme(name);
    if (s) setRate(String(s.rate));
  }

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const P = parseFloat(principal) * 100000;
    const r = parseFloat(rate);
    const t = parseInt(tenure);
    const m = parseInt(moratorium);
    if (!P || P <= 0) { setError('Enter a valid loan amount'); return; }
    if (r < 0 || r > 30) { setError('Rate must be between 0% and 30%'); return; }
    if (t < 1 || t > 360) { setError('Tenure must be 1–360 months'); return; }
    if (m < 0 || m >= t) { setError('Moratorium must be less than tenure'); return; }
    setResult(calcEMI(P, r, t, m));
  }

  const emiData = result ? {
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
  } : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>EMI Calculator</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Compute monthly instalments for NSFDC scheme loans with moratorium support.
        </p>
      </div>

      {/* Scheme presets */}
      <div className="mb-5">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Quick-fill from scheme</p>
        <div className="flex flex-wrap gap-2">
          {SCHEMES.map(s => (
            <button
              key={s.name}
              onClick={() => handleSchemeSelect(s.name)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: selectedScheme === s.name ? 'var(--accent)' : 'var(--border)',
                color: selectedScheme === s.name ? 'var(--accent)' : 'var(--muted)',
                background: selectedScheme === s.name ? 'rgba(59,130,246,.08)' : 'transparent',
              }}
            >
              {s.name} ({s.rate}%)
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={calculate}>
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Loan Amount (in Lakhs ₹)
              </label>
              <input
                type="number"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                placeholder="e.g. 5"
                step="0.1"
                min="0.1"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                step="0.1"
                min="0"
                max="30"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Tenure (months)
              </label>
              <input
                type="number"
                value={tenure}
                onChange={e => setTenure(e.target.value)}
                min="1"
                max="360"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Moratorium Period (months — interest-only, no repayment)
              </label>
              <input
                type="number"
                value={moratorium}
                onChange={e => setMoratorium(e.target.value)}
                min="0"
                max="24"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Education loan moratoriums: 6–12 months typically
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 text-sm px-4 py-3 rounded-xl" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            Calculate EMI
          </button>
        </div>
      </form>

      {emiData && <EMIResultCard data={emiData} />}

      {/* Info box */}
      <div className="mt-5 p-4 rounded-xl text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
        <strong style={{ color: 'var(--foreground)' }}>Formula:</strong> EMI = P × r × (1+r)<sup>n</sup> / ((1+r)<sup>n</sup> – 1)<br/>
        During moratorium, principal accrues simple interest and repayment EMI is recalculated on the inflated principal.
      </div>
    </div>
  );
}
