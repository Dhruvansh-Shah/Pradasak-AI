'use client';

import Link from 'next/link';
import { ShieldCheck, PhoneCall, HelpCircle, FileText, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import EmblemOfIndia from './EmblemOfIndia';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        background: '#00132b',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
        marginTop: 'auto',
        padding: '56px 24px 32px',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        {/* ── Top Multi-Column Grid ────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1.2fr 1.2fr',
            gap: 36,
          }}
        >
          {/* Column 1: Brand & Purpose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 44,
                  borderRadius: 4,
                  background: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                }}
              >
                <EmblemOfIndia size={34} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {t('brand.name', 'Pradarshak AI')}
              </span>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
              {t('footer.mission', 'National SC Financial Assistance Portal engineered for Scheduled Caste beneficiaries. Grounded AI scheme recommendations, exact moratorium EMI projections, and verified channel partner branch discovery.')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <ShieldCheck size={16} color="#34d399" />
              <span style={{ fontSize: 12, color: '#a7f3d0' }}>
                Ministry of Social Justice & Empowerment (MoSJE)
              </span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {t('footer.nav_title', 'Services')}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <Link
                href="/schemes"
                style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
              >
                {t('schemes.title', 'Schemes Catalog')}
              </Link>
              <Link
                href="/chat"
                style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
              >
                {t('cap.c1_title', 'AI Scheme Assistant')}
              </Link>
              <Link
                href="/chat?tab=emi"
                style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
              >
                {t('cap.c2_title', 'EMI & Moratorium')}
              </Link>
              <Link
                href="/partners"
                style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
              >
                {t('cap.c3_title', 'Channel Partner Locator')}
              </Link>
            </div>
          </div>

          {/* Column 3: Grievance & Guidelines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Support & Redressal
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HelpCircle size={14} color="#38bdf8" />
                <span>CPGRAMS Portal</span>
              </span>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color="#38bdf8" />
                <span>Application Guidelines</span>
              </span>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="#38bdf8" />
                <span>State SC/ST Commissions</span>
              </span>
            </div>
          </div>

          {/* Column 4: Helplines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              National Helplines
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>Toll Free (National)</span>
                <strong style={{ color: '#fed7aa', fontSize: 14 }}>1800-11-2001</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>Technical Support</span>
                <strong style={{ color: '#e0f2fe', fontSize: 13 }}>support@nsfdc.nic.in</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Copyright Bar ─────────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <span>
            © {new Date().getFullYear()} National SC Financial Assistance Portal • Pradarshak AI. All Rights Reserved.
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Accessibility Statement (WCAG 2.1 AA)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
