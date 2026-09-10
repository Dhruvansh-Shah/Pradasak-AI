'use client';

import React from 'react';
import {
  Scale,
  ShieldCheck,
  Calculator,
  BookOpen,
} from 'lucide-react';
import VoiceButton from './VoiceButton';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSchemeName } from '@/lib/translations';

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
  const { language, t } = useLanguage();
  const schemes =
    propSchemes && propSchemes.length > 0
      ? propSchemes
      : ([schemeA, schemeB].filter(Boolean) as Scheme[]);

  if (schemes.length === 0) return null;

  // Highlights
  const minRate = Math.min(...schemes.map((s) => Number(s.interest_rate_min) || 999));
  const maxLoan = Math.max(...schemes.map((s) => Number(s.max_loan_lakh) || 0));
  const maxTenure = Math.max(...schemes.map((s) => Number(s.max_tenure_months) || 0));

  const rateRange = (s: Scheme) => {
    return s.interest_rate_min === s.interest_rate_max
      ? `${s.interest_rate_min}% ${t('scheme.per_annum')}`
      : `${s.interest_rate_min}–${s.interest_rate_max}% ${t('scheme.per_annum')}`;
  };

  const moratorium = (s: Scheme) => {
    return s.moratorium_months_min === s.moratorium_months_max
      ? `${s.moratorium_months_min} ${t('scheme.months')}`
      : `${s.moratorium_months_min}–${s.moratorium_months_max} ${t('scheme.months')}`;
  };

  const featureLabel = t('compare.feature') !== 'compare.feature' ? t('compare.feature') : 'Feature';
  const quickActionLabel = t('compare.quick_action') !== 'compare.quick_action' ? t('compare.quick_action') : 'Quick Action';

  const ROWS: {
    label: string;
    render: (s: Scheme) => React.ReactNode;
  }[] = [
    {
      label: t('compare.match_score'),
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
            {Math.round(Number(s.score))}% {t('scheme.match')}
          </span>
        ) : (
          <span style={{ color: 'var(--muted)' }}>—</span>
        ),
    },
    {
      label: t('compare.max_loan'),
      render: (s) => {
        const isBest = Number(s.max_loan_lakh) === maxLoan && maxLoan > 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value">{fmt(s.max_loan_lakh)}</span>
            {isBest && schemes.length > 1 && (
              <span className="badge-highest-limit">
                {t('compare.highest_limit')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: t('compare.interest_rate'),
      render: (s) => {
        const isBest = Number(s.interest_rate_min) === minRate && minRate < 999;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value" style={{ color: isBest ? '#16a34a' : undefined }}>
              {rateRange(s)}
            </span>
            {isBest && schemes.length > 1 && (
              <span className="badge-lowest-rate">
                {t('compare.lowest_rate')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: t('compare.income_limit'),
      render: (s) => <span className="comparison-cell-value" style={{ fontWeight: 600 }}>≤ {fmt(s.max_income_lakh)}</span>,
    },
    {
      label: t('compare.tenure'),
      render: (s) => {
        const isBest = Number(s.max_tenure_months) === maxTenure && maxTenure > 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="comparison-cell-value">
              {t('scheme.tenure_up_to')} {s.max_tenure_months} {t('scheme.months')}
            </span>
            {isBest && schemes.length > 1 && (
              <span className="badge-longest-tenure">
                {t('compare.longest_tenure')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: t('compare.moratorium'),
      render: (s) => <span className="comparison-cell-value" style={{ fontWeight: 600 }}>{moratorium(s)}</span>,
    },
    {
      label: t('compare.activities'),
      render: (s) => {
        const types = s.eligible_project_types || [];
        if (types.length === 0) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t('compare.general_enterprises')}</span>;
        return (
          <span className="comparison-cell-subtext">
            {types.slice(0, 3).map((item) => item.replace(/_/g, ' ')).join(', ')}
            {types.length > 3 ? ` +${types.length - 3} more` : ''}
          </span>
        );
      },
    },
    {
      label: t('compare.beneficiaries'),
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
          {s.gender_eligibility === 'women_only' ? t('compare.women_only') : t('compare.all_sc')}
        </span>
      ),
    },
    {
      label: t('compare.channels'),
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
            <h4 className="comparison-title">{t('compare.title')}</h4>
            <span className="comparison-subtitle">
              {t('compare.comparing_count').replace('{count}', String(schemes.length))}
            </span>
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
              title={t('compare.listen_title')}
            />
          )}

          <span className="comparison-authoritative-badge">
            <ShieldCheck size={13} />
            {t('compare.official_data')}
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
              {featureLabel}
            </div>
            {schemes.map((s, i) => (
              <div key={i} style={{ padding: '0 8px', textAlign: 'center' }}>
                <h5 className="comparison-scheme-header-name">
                  {getLocalizedSchemeName(s.name, language)}
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
              <div className="comparison-quick-action-label">{quickActionLabel}</div>
              {schemes.map((s, sIdx) => {
                const localizedName = getLocalizedSchemeName(s.name, language);
                return (
                  <div key={sIdx} style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '0 6px' }}>
                    {onKnowMore && (
                      <button
                        type="button"
                        onClick={() => onKnowMore(s)}
                        className="btn-scheme-details"
                        title={`${t('scheme.action_know_more')}: ${localizedName}`}
                      >
                        <BookOpen size={12} />
                        <span>{t('scheme.action_know_more')}</span>
                      </button>
                    )}
                    {onCalculateEMI && (
                      <button
                        type="button"
                        onClick={() => onCalculateEMI(s)}
                        className="btn-scheme-emi"
                        title={`${t('scheme.action_emi')}: ${localizedName}`}
                      >
                        <Calculator size={12} />
                        <span>{t('scheme.action_emi')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
