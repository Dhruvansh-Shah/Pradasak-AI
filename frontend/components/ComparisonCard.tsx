'use client';

import {
  Scale,
  ShieldCheck,
  Calculator,
  BookOpen,
} from 'lucide-react';
import VoiceButton from './VoiceButton';

export interface Scheme {
  id?: number;
  name: string;
  category: string;
  max_loan_lakh: number;
  min_loan_lakh?: number | null;
  interest_rate_min: number;
  interest_rate_max: number;
  max_tenure_months: number;
  min_tenure_months?: number | null;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_income_lakh: number;
  coverage_percent?: number | null;
  gender_eligibility?: string | null;
  score?: number | null;
  eligible_project_types?: string[] | null;
  channel_partner_types?: string[] | null;
}

function fmt(lakh: number | null | undefined) {
  if (lakh == null || isNaN(Number(lakh))) return 'N/A';
  const l = Number(lakh);
  if (l >= 1) return `₹${l} Lakh`;
  return `₹${(l * 100000).toLocaleString('en-IN')}`;
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

interface Props {
  schemes?: Scheme[];
  schemeA?: Scheme;
  schemeB?: Scheme;
  onCalculateEMI?: (s: Scheme) => void;
  onKnowMore?: (s: Scheme) => void;
  speechText?: string;
  onPlayTTS?: () => void;
  onStopTTS?: () => void;
  isPlaying?: boolean;
  isLoadingTTS?: boolean;
}

export default function ComparisonCard({
  schemes: propSchemes,
  schemeA,
  schemeB,
  onCalculateEMI,
  onKnowMore,
  speechText,
  onPlayTTS,
  onStopTTS,
  isPlaying,
  isLoadingTTS,
}: Props) {
  const schemes =
    propSchemes && propSchemes.length > 0
      ? propSchemes
      : ([schemeA, schemeB].filter(Boolean) as Scheme[]);

  if (schemes.length === 0) return null;

  // Highlights
  const minRate = Math.min(...schemes.map((s) => Number(s.interest_rate_min) || 999));
  const maxLoan = Math.max(...schemes.map((s) => Number(s.max_loan_lakh) || 0));
  const maxTenure = Math.max(...schemes.map((s) => Number(s.max_tenure_months) || 0));

  const ROWS: {
    label: string;
    render: (s: Scheme) => React.ReactNode;
  }[] = [
    {
      label: 'Match Score',
      render: (s) =>
        s.score != null ? (
          <span
            style={{
              fontWeight: 800,
              color: '#16a34a',
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            {Math.round(Number(s.score))}% Match
          </span>
        ) : (
          <span style={{ color: 'var(--muted)' }}>—</span>
        ),
    },
    {
      label: 'Maximum Loan',
      render: (s) => {
        const isBest = Number(s.max_loan_lakh) === maxLoan && maxLoan > 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value">{fmt(s.max_loan_lakh)}</span>
            {isBest && schemes.length > 1 && (
              <span className="badge-highest-limit">
                Highest Limit
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'Subsidized Interest',
      render: (s) => {
        const isBest = Number(s.interest_rate_min) === minRate && minRate < 999;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value" style={{ color: isBest ? '#16a34a' : undefined }}>
              {rateRange(s)}
            </span>
            {isBest && schemes.length > 1 && (
              <span className="badge-lowest-rate">
                Lowest Rate ★
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'Annual Income Cap',
      render: (s) => <span className="comparison-cell-value" style={{ fontWeight: 600 }}>≤ {fmt(s.max_income_lakh)}</span>,
    },
    {
      label: 'Repayment Tenure',
      render: (s) => {
        const isBest = Number(s.max_tenure_months) === maxTenure && maxTenure > 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value">Up to {s.max_tenure_months} Mo</span>
            {isBest && schemes.length > 1 && (
              <span className="badge-longest-tenure">
                Longest Tenure
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'Moratorium Grace',
      render: (s) => <span className="comparison-cell-value" style={{ fontWeight: 600 }}>{moratorium(s)}</span>,
    },
    {
      label: 'Eligible Activities',
      render: (s) => {
        const types = s.eligible_project_types || [];
        if (types.length === 0) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>General Enterprises</span>;
        return (
          <span className="comparison-cell-subtext">
            {types.slice(0, 3).map((t) => t.replace(/_/g, ' ')).join(', ')}
            {types.length > 3 ? ` +${types.length - 3} more` : ''}
          </span>
        );
      },
    },
    {
      label: 'Target Beneficiaries',
      render: (s) => (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: s.gender_eligibility === 'women_only' ? 'rgba(219, 39, 119, 0.12)' : 'var(--surface-container)',
            color: s.gender_eligibility === 'women_only' ? '#db2777' : 'var(--text)',
            border: s.gender_eligibility === 'women_only' ? '1px solid rgba(219, 39, 119, 0.25)' : '1px solid var(--border)',
          }}
        >
          {s.gender_eligibility === 'women_only' ? '👩 Women Only' : 'All SC Beneficiaries'}
        </span>
      ),
    },
    {
      label: 'Application Channel',
      render: (s) => {
        const channels = s.channel_partner_types || ['SCA', 'PSB', 'RRB'];
        return (
          <span className="comparison-cell-subtext" style={{ fontWeight: 600 }}>
            {channels.join(', ')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="comparison-card">
      {/* ── Table Top Banner with Listen button ─────────────────────────── */}
      <div className="comparison-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="comparison-icon-box">
            <Scale size={18} />
          </div>
          <div>
            <h4 className="comparison-title">Scheme Comparison Matrix</h4>
            <span className="comparison-subtitle">Comparing {schemes.length} schemes side-by-side</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onPlayTTS && (
            <VoiceButton
              isPlaying={!!isPlaying}
              isLoading={!!isLoadingTTS}
              onPlay={onPlayTTS}
              onStop={onStopTTS || (() => {})}
              variant="glass"
              title="Listen to scheme comparison"
            />
          )}

          <span className="comparison-authoritative-badge">
            <ShieldCheck size={13} />
            Authoritative Data
          </span>
        </div>
      </div>

      {/* ── Horizontally Scrollable Table Canvas ──────────────────────────── */}
      <div className="comparison-table-scroll">
        <div style={{ minWidth: 200 + schemes.length * 200 }}>
          {/* Column Header */}
          <div
            className="comparison-header-row"
            style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${schemes.length}, 1fr)`,
            }}
          >
            <div className="comparison-feature-header">
              Feature
            </div>
            {schemes.map((s, i) => (
              <div key={i} style={{ padding: '0 8px', textAlign: 'center' }}>
                <h5 className="comparison-scheme-header-name">
                  {s.name}
                </h5>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ROWS.map((row, rIdx) => {
              const isEven = rIdx % 2 === 0;
              return (
                <div
                  key={rIdx}
                  className={`comparison-row ${isEven ? 'comparison-row-even' : 'comparison-row-odd'}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `200px repeat(${schemes.length}, 1fr)`,
                  }}
                >
                  <div className="comparison-feature-label">{row.label}</div>
                  {schemes.map((s, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', justifyContent: 'center', padding: '0 8px' }}>
                      {row.render(s)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer for each Scheme with exact s.id */}
          {(onCalculateEMI || onKnowMore) && (
            <div
              className="comparison-action-footer"
              style={{
                display: 'grid',
                gridTemplateColumns: `200px repeat(${schemes.length}, 1fr)`,
              }}
            >
              <div className="comparison-quick-action-label">Quick Action</div>
              {schemes.map((s, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '0 6px' }}>
                  {onKnowMore && (
                    <button
                      type="button"
                      onClick={() => onKnowMore(s)}
                      className="btn-scheme-details"
                      title={`Details for ${s.name}`}
                    >
                      <BookOpen size={12} />
                      <span>Details</span>
                    </button>
                  )}
                  {onCalculateEMI && (
                    <button
                      type="button"
                      onClick={() => onCalculateEMI(s)}
                      className="btn-scheme-emi"
                      title={`Calculate EMI for ${s.name}`}
                    >
                      <Calculator size={12} />
                      <span>EMI</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
