'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, ArrowRight, Lock, Scale, Building } from 'lucide-react';
import Link from 'next/link';

interface MatrixRow {
  dimension: string;
  panchayatOrMiddleman: {
    status: 'negative' | 'warning';
    title: string;
    description: string;
  };
  pradarshakAi: {
    status: 'positive';
    title: string;
    description: string;
    statutoryCite?: string;
  };
  impact: string;
}

const MATRIX_DATA: MatrixRow[] = [
  {
    dimension: 'Constitutional & Legal Mandate',
    panchayatOrMiddleman: {
      status: 'negative',
      title: 'No Lending License (Art. 243G)',
      description: 'Gram Panchayats are constitutional civic bodies for sanitation, water & village roads. They have NO legal authority or banking license to disburse NSFDC concessional loans.',
    },
    pradarshakAi: {
      status: 'positive',
      title: 'Accredited Statutory Gateway',
      description: 'Directly routes to 100+ Ministry-authorized Channel Partners (SCAs, PSBs, RRBs, NBFC-MFIs) holding legitimate disbursement powers.',
      statutoryCite: 'MoSJE & NSFDC Operating Guidelines',
    },
    impact: 'Eliminates misrouted applications & bank rejection',
  },
  {
    dimension: 'Middleman & Commission Extortion',
    panchayatOrMiddleman: {
      status: 'negative',
      title: '10% – 25% "Dalal" Cuts',
      description: 'Local political intermediaries and middlemen extort illegal commissions from marginalized SC citizens promising offline loan approvals.',
    },
    pradarshakAi: {
      status: 'positive',
      title: '100% Middleman-Free (0% Cut)',
      description: 'Direct digital matching. Zero commission agents. Generates a tamper-evident, cryptographically verified Form-A packet directly for the branch.',
      statutoryCite: 'Digital Public Infrastructure (DPI)',
    },
    impact: 'Protects 100% of sanctioned funds for business capital',
  },
  {
    dimension: 'Speed & Process Transparency',
    panchayatOrMiddleman: {
      status: 'warning',
      title: '6 to 12 Months Delay',
      description: 'Physical paper files sit dormant in block development offices with zero status visibility or algorithmic accountability.',
    },
    pradarshakAi: {
      status: 'positive',
      title: 'Instant Pre-Qualification (<100ms)',
      description: 'Deterministic 3-tier scheme scoring and PostGIS geocoding locate active, healthy bank branches in seconds.',
      statutoryCite: 'Sub-100ms SLA Engine',
    },
    impact: 'Fast disbursement within 15 to 30 days',
  },
  {
    dimension: 'Rate Protection vs Debt Traps',
    panchayatOrMiddleman: {
      status: 'negative',
      title: '24% – 36% Moneylender Traps',
      description: 'Confusion and offline rejection force applicants into predatory informal moneylenders charging compounded monthly interest.',
    },
    pradarshakAi: {
      status: 'positive',
      title: '4% – 8% Subsidized Concessional Rate',
      description: 'Strict statutory interest rate caps, simple interest moratorium accrual, and verified wealth preservation shields.',
      statutoryCite: 'Statutory Concessional Caps',
    },
    impact: 'Saves ₹75,000+ per ₹1.4L in retained household wealth',
  },
  {
    dimension: 'Fund Disbursement & Auditability',
    panchayatOrMiddleman: {
      status: 'warning',
      title: 'Manual Cheques / Cash Risks',
      description: 'Manual disbursement vouchers vulnerable to diversion, skimming, and lack of central Ministry audit trails.',
    },
    pradarshakAi: {
      status: 'positive',
      title: 'Direct Bank DBT & Escrow Transfer',
      description: 'Direct Benefit Transfer (DBT) into verified Aadhaar-linked beneficiary accounts with central audit logging.',
      statutoryCite: 'Public Financial Management System (PFMS)',
    },
    impact: 'Total transparency & zero fraud leakage',
  },
];

export default function InstitutionalMatrix() {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1.5px solid #e2e8f0',
        padding: '36px 32px',
        boxShadow: '0 8px 30px rgba(11, 31, 58, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto 36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            fontSize: 12.5,
            fontWeight: 800,
            color: '#065f46',
            marginBottom: 12,
          }}
        >
          <Scale size={15} />
          <span>Constitutional & Institutional Clarity • Article 243G Compliance</span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0b1f3a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Why Pradarshak AI vs. Local Middlemen & Gram Panchayats
        </h2>

        <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Under Article 243G of the Constitution of India, Gram Panchayats govern local village works.
          They have <strong>no statutory banking license</strong> to disburse NSFDC funds. Pradarshak AI connects you directly
          to accredited financial institutions with <strong>0% middleman commission</strong>.
        </p>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MATRIX_DATA.map((row, idx) => (
          <div
            key={row.dimension}
            style={{
              display: 'grid',
              gridTemplateColumns: '240px 1fr 1.2fr',
              gap: 16,
              padding: '18px 20px',
              borderRadius: 12,
              background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
              border: '1px solid #edf2f7',
              alignItems: 'center',
            }}
          >
            {/* Dimension Title & Impact */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                {row.dimension}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#047857',
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                ✓ {row.impact}
              </div>
            </div>

            {/* Panchayat / Middleman Column */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                display: 'flex',
                gap: 10,
              }}
            >
              <XCircle size={18} color="#e53e3e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#9b2c2c', marginBottom: 2 }}>
                  {row.panchayatOrMiddleman.title}
                </div>
                <div style={{ fontSize: 12, color: '#742a2a', lineHeight: 1.45 }}>
                  {row.panchayatOrMiddleman.description}
                </div>
              </div>
            </div>

            {/* Pradarshak AI Column */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                display: 'flex',
                gap: 10,
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                    {row.pradarshakAi.title}
                  </span>
                  {row.pradarshakAi.statutoryCite && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#15803d',
                        background: '#dcfce7',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {row.pradarshakAi.statutoryCite}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#14532d', lineHeight: 1.45 }}>
                  {row.pradarshakAi.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Key Takeaway Callout */}
      <div
        style={{
          marginTop: 28,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #001e40 0%, #003366 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldCheck size={28} color="#ffdcc2" />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#ffdcc2' }}>
              Zero Dalal Guarantee • Direct Sovereign Channel Financing
            </div>
            <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.4 }}>
              Never pay commission to any village agent or middleman. Apply directly through Pradarshak AI to your designated State Channelizing Agency or bank.
            </div>
          </div>
        </div>

        <Link
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 8,
            background: '#f97316',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
          }}
        >
          <span>Register Verified Account</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
