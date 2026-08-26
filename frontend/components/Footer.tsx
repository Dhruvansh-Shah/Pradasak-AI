'use client';

import Link from 'next/link';
import { Landmark, ShieldCheck, HeartHandshake, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        background: '#071426',
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
            gridTemplateColumns: '2fr 1.2fr 1.4fr',
            gap: 48,
          }}
        >
          {/* Column 1: Brand & Purpose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                }}
              >
                <Landmark size={18} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {t('brand.name', 'Pradarshak AI')}
              </span>
            </div>

            <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.65, maxWidth: 440, margin: 0 }}>
              {t('footer.mission', 'An intelligent channel finance discovery platform engineered for Scheduled Caste beneficiaries. Grounded AI scheme recommendations, exact moratorium EMI projections, and verified channel partner branch discovery.')}
            </p>
          </div>

          {/* Column 2: Quick Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {t('footer.nav_title', 'Navigation')}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <Link
                href="/schemes"
                style={{ color: '#e2e8f0', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; }}
              >
                {t('schemes.title', 'Loan Schemes Catalog')}
              </Link>
              <Link
                href="/chat"
                style={{ color: '#e2e8f0', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; }}
              >
                {t('cap.c1_title', 'AI Scheme Recommender')}
              </Link>
              <Link
                href="/chat?tab=emi"
                style={{ color: '#e2e8f0', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; }}
              >
                {t('emi.title', 'EMI & Moratorium Calculator')}
              </Link>
              <Link
                href="/partners"
                style={{ color: '#e2e8f0', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; }}
              >
                {t('partners.title', 'Channel Partner Locator')}
              </Link>
            </div>
          </div>

          {/* Column 3: Governance & Trust */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {t('footer.gov_title', 'Governance & Trust')}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0 }} />
                <span>{t('footer.nsfdc_guide', 'NSFDC Official Guidelines')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeartHandshake size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span>{t('footer.ministry', 'Ministry of Social Justice & Empowerment')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span>{t('footer.sih', 'Smart India Hackathon')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar: Copyright & Legal ─────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: '#94a3b8',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8' }}>
            {t('footer.copyright', '© 2024 National Scheduled Castes Finance and Development Corporation (NSFDC), Govt. of India.')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#cbd5e1' }}>
            <Link
              href="#"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
            >
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <span>•</span>
            <Link
              href="#"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
            >
              {t('footer.terms', 'Terms of Service')}
            </Link>
            <span>•</span>
            <Link
              href="#"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
            >
              {t('footer.hyperlink', 'Hyperlinking Policy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
