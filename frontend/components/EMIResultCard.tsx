'use client';

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
  const interestPct = Math.round((totalInterest / totalPayable) * 100);

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {data.schemeName && (
        <div className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
          EMI for {data.schemeName}
        </div>
      )}

      {/* Hero EMI */}
      <div className="text-center mb-4 py-3 rounded-xl" style={{ background: 'var(--accent)' }}>
        <div className="text-white text-xs mb-1 opacity-80">Monthly EMI</div>
        <div className="text-white text-3xl font-bold">{fmt(emi)}</div>
        <div className="text-white text-xs opacity-70 mt-1">per month</div>
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Loan Amount</div>
          <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{fmt(params.principal)}</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Total Interest</div>
          <div className="font-bold text-sm" style={{ color: '#ef4444' }}>{fmt(totalInterest)}</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Total Payable</div>
          <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{fmt(totalPayable)}</div>
        </div>
      </div>

      {/* Params summary */}
      <div
        className="text-xs rounded-lg px-3 py-2"
        style={{ background: 'var(--background)', color: 'var(--muted)' }}
      >
        {params.rate}% p.a. · {params.tenureMonths} months repayment
        {params.moratoriumMonths > 0 && ` · ${params.moratoriumMonths} months moratorium`}
        {' · '}Interest = {interestPct}% of total payable
      </div>
    </div>
  );
}
