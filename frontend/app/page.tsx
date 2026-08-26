'use client';

import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  MessageCircle,
  Calculator,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Scale,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  const STATS = [
    { value: t('stats.s1_val', '15+'), label: t('stats.s1_lbl', 'Concessional Schemes'), sub: t('stats.s1_sub', 'Micro-credit to ₹50L loans') },
    { value: t('stats.s2_val', '4% – 8%'), label: t('stats.s2_lbl', 'Subsidized Interest'), sub: t('stats.s2_sub', 'Far lower than commercial rates') },
    { value: t('stats.s3_val', '100+'), label: t('stats.s3_lbl', 'Channel Partners'), sub: t('stats.s3_sub', 'SCAs, PSBs, RRBs & MFIs') },
    { value: t('stats.s4_val', 'Up to 90%'), label: t('stats.s4_lbl', 'Project Coverage'), sub: t('stats.s4_sub', 'Government backed assistance') },
  ];

  const CORE_SERVICES = [
    {
      icon: MessageCircle,
      color: '#0b1f3a',
      bg: '#eff6ff',
      badge: t('cap.c1_badge', 'Multilingual AI'),
      title: t('cap.c1_title', 'Grounded Scheme Recommender'),
      desc: t('cap.c1_desc', 'Describe your business or educational goal in Hindi, Marathi, or English. Our grounded AI pipeline matches and ranks official schemes without hallucinating interest rates or loan caps.'),
      href: '/chat',
      cta: t('cap.c1_cta', 'Start Conversation'),
    },
    {
      icon: Calculator,
      color: '#c2410c',
      bg: '#fff7ed',
      badge: t('cap.c2_badge', 'Accurate Math'),
      title: t('cap.c2_title', 'Moratorium & EMI Calculator'),
      desc: t('cap.c2_desc', 'Deterministic calculation for tiered interest (4%–8%), moratorium interest accrual (3–12 months), and repayment schedules tailored for your exact budget.'),
      href: '/chat?tab=emi',
      cta: t('cap.c2_cta', 'Calculate EMI'),
    },
    {
      icon: MapPin,
      color: '#15803d',
      bg: '#f0fdf4',
      badge: t('cap.c3_badge', 'PostGIS Spatial'),
      title: t('cap.c3_title', 'Healthy Channel Partner Locator'),
      desc: t('cap.c3_desc', 'Locate 100+ State Agencies (SCAs), Rural Banks (RRBs), and MFIs filtered by real-time NPA health, scheme eligibility, and geographic proximity.'),
      href: '/partners',
      cta: t('cap.c3_cta', 'Find Nearby Partners'),
    },
    {
      icon: ShieldCheck,
      color: '#7e22ce',
      bg: '#fdf4ff',
      badge: t('cap.c4_badge', 'Direct Verification'),
      title: t('cap.c4_title', 'Eligibility & Document Engine'),
      desc: t('cap.c4_desc', 'Instant verification rules for caste certificates, income threshold (≤ ₹5L/yr), project reports, and necessary identity proofs before applying.'),
      href: '/schemes',
      cta: t('cap.c4_cta', 'Browse Catalog'),
    },
  ];

  const HOW_IT_WORKS = [
    {
      Icon: MessageCircle,
      step: '01',
      title: t('how.step1_title', 'Tell Us Your Needs'),
      desc: t('how.step1_desc', 'Chat in Hindi, Marathi, or English about your loan purpose and family income.'),
    },
    {
      Icon: Scale,
      step: '02',
      title: t('how.step2_title', 'AI Matches Schemes'),
      desc: t('how.step2_desc', 'We query the active catalog and compare loan caps, subsidies, and interest terms.'),
    },
    {
      Icon: Calculator,
      step: '03',
      title: t('how.step3_title', 'Plan Your Repayment'),
      desc: t('how.step3_desc', 'Review exact monthly EMIs with tailored grace periods before committing.'),
    },
    {
      Icon: Building2,
      step: '04',
      title: t('how.step4_title', 'Connect to Partner'),
      desc: t('how.step4_desc', 'Direct contact info for the nearest financially healthy Channel Partner to submit docs.'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#0f172a' }}>
      <NavBar />

      {/* ── Hero Section (High-Contrast Dark Midnight) ────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(180deg, #0b1f3a 0%, #071426 100%)',
          color: '#ffffff',
          padding: '72px 24px 84px',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {/* Left Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '6px 14px',
                borderRadius: 20,
                width: 'fit-content',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('hero.badge', 'National SC Finance & Development Corporation')}
              </span>
            </div>

            <h1
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.18,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              {t('hero.title_part1', 'Concessional Loans & Finance,')}{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                {t('hero.title_part2', 'Made Simple & Grounded')}
              </span>
            </h1>

            <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.65, maxWidth: 580, margin: 0 }}>
              {t('hero.desc', 'Discover official government assistance programs, compute accurate monthly EMIs with moratorium support, and find verified channel partners near you without bureaucratic confusion.')}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, paddingTop: 8 }}>
              <Link
                href="/chat"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#e87722',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px 26px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(232, 119, 34, 0.35)',
                  transition: 'all 150ms ease',
                }}
              >
                <MessageCircle size={18} />
                <span>{t('hero.cta_chat', 'Talk to AI Assistant')}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/schemes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '14px 24px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {t('hero.cta_schemes', 'Browse All Schemes')}
              </Link>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, paddingTop: 12, fontSize: 13, color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ color: '#e2e8f0' }}>{t('hero.trust_zero_hallucination', 'Zero Hallucinations')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ color: '#e2e8f0' }}>{t('hero.trust_multilingual', 'Multilingual (Hindi/Marathi)')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ color: '#e2e8f0' }}>{t('hero.trust_partners', '100+ Verified Partners')}</span>
              </div>
            </div>
          </div>

          {/* Right Live Simulation Card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 20,
                padding: '24px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={18} color="#fbbf24" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {t('hero.demo_title', 'Live AI Demonstration')}
                    </h3>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>
                      {t('hero.demo_sub', 'Scheme Matching & Routing')}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    background: 'rgba(52, 211, 153, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                  }}
                >
                  {t('hero.demo_verified', 'Verified')}
                </span>
              </div>

              {/* Sample Dialog */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    {t('hero.demo_q_label', 'Applicant:')}
                  </span>
                  {t('hero.demo_q', '"I want to open a small grocery shop in Lucknow. Family earns ₹2.8 Lakh/year. What scheme can I get?"')}
                </div>

                <div
                  style={{
                    background: '#0a1d35',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: 14,
                    padding: '14px',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: 13 }}>
                      {t('hero.demo_ans_title', 'Recommended: Term Loan Scheme')}
                    </span>
                    <span style={{ fontSize: 11, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      {t('hero.demo_ans_rate', '7% p.a.')}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    {t('hero.demo_ans_desc', 'Covers up to 90% project cost with a 6-month moratorium. Nearest eligible SCA: UP Scheduled Castes Finance & Dev. Corp.')}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/chat"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#0b1f3a',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '11px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span>{t('hero.demo_btn', 'Try With Your Own Details')}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Showcase (4 Clean Boxes) ─────────────────────────────── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '48px 24px',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Services Section (2x2 Grid) ─────────────────────────────────── */}
      <section style={{ padding: '72px 24px', width: '100%' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 40,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 'fit-content',
                margin: '0 auto',
                fontSize: 11,
                fontWeight: 800,
                color: '#c2410c',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '4px 12px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {t('cap.badge', 'Platform Capabilities')}
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
              {t('cap.title', 'Designed for Transparency & Speed')}
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              {t('cap.desc', 'Eliminating intermediate confusion with grounded AI, accurate loan math, and geo-spatial channel routing.')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24,
            }}
          >
            {CORE_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 18,
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(11,31,58,0.03)',
                    transition: 'all 180ms ease',
                    minHeight: 250,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: s.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} color={s.color} />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {s.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>
                      {s.title}
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>

                  <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    <Link
                      href={s.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: '#0b1f3a',
                        textDecoration: 'none',
                      }}
                    >
                      <span>{s.cta}</span>
                      <ChevronRight size={15} color="#e87722" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works Section (4 Steps) ───────────────────────────────────── */}
      <section
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '72px 24px',
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
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 'fit-content',
                margin: '0 auto',
                fontSize: 11,
                fontWeight: 800,
                color: '#0b1f3a',
                background: '#eef3f9',
                border: '1px solid #dbe5f1',
                padding: '4px 12px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {t('how.badge', 'Simple 4-Step Process')}
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
              {t('how.title', 'From Inquiry to Disbursement')}
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              {t('how.desc', 'How Pradarshak AI guides an applicant directly to the right channel partner with confidence.')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
            }}
          >
            {HOW_IT_WORKS.map(({ Icon, step, title, desc }) => (
              <div
                key={step}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#0b1f3a',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {step}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ───────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', width: '100%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
              color: '#ffffff',
              borderRadius: 24,
              padding: '48px 40px',
              boxShadow: '0 12px 36px rgba(11,31,58,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 32,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {t('cta.tag', 'Ready to explore options?')}
              </span>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                {t('cta.title', 'Find the concessional loan scheme that fits your venture')}
              </h2>
              <p style={{ fontSize: 14.5, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                {t('cta.desc', 'Chat with our AI assistant in Hindi, Marathi, or English. It takes less than 2 minutes to discover your eligibility and nearest partner.')}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
              <Link
                href="/chat"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#e87722',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  padding: '13px 24px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(232,119,34,0.35)',
                }}
              >
                <MessageCircle size={17} />
                <span>{t('cta.btn_chat', 'Launch Assistant')}</span>
              </Link>

              <Link
                href="/partners"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 600,
                  padding: '13px 22px',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                <MapPin size={17} color="#fbbf24" />
                <span>{t('cta.btn_partners', 'Find Partners')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
