'use client';

import { Calculator, Calendar, Percent, ShieldAlert } from 'lucide-react';

interface EMIData {
  emi: number;
  totalPayable: number;
  totalInterest: number;
  params: { principal: number; rate: number; tenureMonths: number; moratoriumMonths: number };
  schemeName?: string;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function EMIResultCard({ data }: { data: EMIData }) {
  const { emi, totalPayable, totalInterest, params } = data;
  const interestPct = totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      
      {data.schemeName && (
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>Calculated EMI for: {data.schemeName}</span>
        </div>
      )}

      {/* Hero Highlight */}
      <div className="bg-gradient-to-br from-[#0b1f3a] to-[#16345d] text-white rounded-2xl p-5 text-center shadow-md space-y-1">
        <div className="text-xs text-slate-300 font-medium">Estimated Monthly Instalment</div>
        <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
          {fmt(emi)}
        </div>
        <div className="text-[11px] text-slate-400">per month after moratorium period</div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Principal</div>
          <div className="text-xs sm:text-sm font-extrabold text-slate-900">{fmt(params.principal)}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Interest</div>
          <div className="text-xs sm:text-sm font-extrabold text-red-600">{fmt(totalInterest)}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Outflow</div>
          <div className="text-xs sm:text-sm font-extrabold text-[#0b1f3a]">{fmt(totalPayable)}</div>
        </div>
      </div>

      {/* Terms Info Bar */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <Percent className="w-3.5 h-3.5 text-blue-600" />
          <span>{params.rate}% p.a.</span>
        </div>

        <div className="flex items-center gap-1.5 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{params.tenureMonths} Months Total</span>
        </div>

        {params.moratoriumMonths > 0 && (
          <div className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
            {params.moratoriumMonths} Mo Moratorium
          </div>
        )}
      </div>
    </div>
  );
}
