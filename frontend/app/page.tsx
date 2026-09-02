'use client';

import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Interactive3DCard from '@/components/Interactive3DCard';
import Hero3DCanvas from '@/components/Hero3DCanvas';
import EmblemOfIndia from '@/components/EmblemOfIndia';
import {
  MessageCircle,
  Calculator,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Scale,
  Building2,
  ChevronRight,
  Percent,
  Layers,
  Award,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  const STATS = [
    { value: t('stats.s1_val', '15+'), label: t('stats.s1_lbl', 'Concessional Schemes'), sub: t('stats.s1_sub', 'Micro-credit to ₹50L loans'), icon: Layers, color: '#003366' },
    { value: t('stats.s2_val', '4% – 8%'), label: t('stats.s2_lbl', 'Subsidized Interest'), sub: t('stats.s2_sub', 'Far lower than commercial rates'), icon: Percent, color: '#15803d' },
    { value: t('stats.s3_val', '100+'), label: t('stats.s3_lbl', 'Channel Partners'), sub: t('stats.s3_sub', 'SCAs, PSBs, RRBs & MFIs'), icon: Building2, color: '#8f4e00' },
    { value: t('stats.s4_val', 'Up to 90%'), label: t('stats.s4_lbl', 'Project Coverage'), sub: t('stats.s4_sub', 'Government backed assistance'), icon: Award, color: '#001e40' },
  ];

  const CORE_SERVICES = [
    {
      icon: MessageCircle,
      color: '#003366',
      bg: '#eff6ff',
      badge: t('cap.c1_badge', 'Assistance'),
      title: t('cap.c1_title', 'Scheme Recommender & Chat'),
      desc: t('cap.c1_desc', 'Describe your business or educational goal in Hindi, Marathi, or English. Discover verified official schemes ranked accurately for your income and project profile.'),
      href: '/chat',
      cta: t('cap.c1_cta', 'Start Conversation'),
    },
    {
      icon: Calculator,
      color: '#8f4e00',
      bg: '#fff7ed',
      badge: t('cap.c2_badge', 'Calculations'),
      title: t('cap.c2_title', 'Moratorium & EMI Calculator'),
      desc: t('cap.c2_desc', 'Compute exact monthly repayments with tiered interest rates (4%–8%), moratorium interest accrual (3–12 months), and full amortization schedules.'),
      href: '/chat?tab=emi',
      cta: t('cap.c2_cta', 'Calculate EMI'),
    },
    {
      icon: MapPin,
      color: '#15803d',
      bg: '#f0fdf4',
      badge: t('cap.c3_badge', 'Branch Locator'),
      title: t('cap.c3_title', 'Channel Partner Locator'),
      desc: t('cap.c3_desc', 'Locate 100+ State Channelising Agencies (SCAs), Public Sector Banks, and Regional Rural Banks filtered by scheme eligibility and proximity.'),
      href: '/partners',
      cta: t('cap.c3_cta', 'Find Nearby Partners'),
    },
    {
      icon: ShieldCheck,
      color: '#001e40',
      bg: '#f8fafc',
      badge: t('cap.c4_badge', 'Verification'),
      title: t('cap.c4_title', 'Eligibility & Document Engine'),
      desc: t('cap.c4_desc', 'Check mandatory criteria including caste certification, family income ceiling (≤ ₹5L/yr), and project report guidelines before submitting your application.'),
      href: '/schemes',
      cta: t('cap.c4_cta', 'Browse Catalog'),
    },
  ];

  const HOW_IT_WORKS = [
    {
      Icon: UserCheck,
      step: '1',
      title: t('how.step1_title', 'Profile & Requirements'),
      desc: t('how.step1_desc', 'Provide your project purpose, target loan amount, and annual family income.'),
    },
    {
      Icon: Scale,
      step: '2',
      title: t('how.step2_title', 'Scheme Matching'),
      desc: t('how.step2_desc', 'System identifies eligible concessional programs with lowest subsidized interest rates.'),
    },
    {
      Icon: Calculator,
      step: '3',
      title: t('how.step3_title', 'Repayment Planning'),
      desc: t('how.step3_desc', 'Calculate exact EMIs and moratorium grace periods tailored for your budget.'),
    },
    {
      Icon: Building2,
      step: '4',
      title: t('how.step4_title', 'Partner Submission'),
      desc: t('how.step4_desc', 'Connect directly to your nearest State Channelising Agency or nominated bank branch.'),
    },
  ];

  const FEATURED_SCHEMES = [
    {
      title: 'Mahila Samriddhi Yojana (MSY)',
      category: 'Micro Finance',
      rate: '4% p.a.',
      maxLoan: '₹1.40 Lakh',
      tenure: '3.5 Years',
      moratorium: '3 Months',
      desc: 'Micro-credit assistance program for women entrepreneurs in petty trade, tailoring, dairy, and artisanal crafts.',
      color: '#8f4e00',
    },
    {
      title: 'Term Loan Scheme',
      category: 'Term Loan',
      rate: '6% – 8% p.a.',
      maxLoan: '₹50.00 Lakh',
      tenure: '5 – 10 Years',
      moratorium: '6 – 12 Months',
      desc: 'Project financing for viable ventures in manufacturing, agricultural machinery, transport, and service sectors.',
      color: '#003366',
    },
    {
      title: 'Education Loan Scheme (ELS)',
      category: 'Education Loan',
      rate: '4% p.a.',
      maxLoan: '₹20.00 Lakh',
      tenure: '5 Years post study',
      moratorium: 'Course + 6m',
      desc: 'Concessional education credit for professional and technical higher education courses in India and abroad.',
      color: '#15803d',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fbf9f8', color: '#1b1c1c' }}>
      <NavBar />

      {/* ── Official Hero Section with 3D Scheme Network Simulator ──────────── */}
      <section
        style={{
          background: '#001e40',
          color: '#ffffff',
          padding: '56px 24px 64px',
          borderBottom: '4px solid #fe9832',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* Left Hero Text Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Clean Institutional Org Tag */}
            <div
              className="badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '5px 12px',
                borderRadius: 4,
                width: 'fit-content',
              }}
            >
              <div style={{ width: 22, height: 24, borderRadius: 2, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                <EmblemOfIndia size={18} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                National SC Finance & Development Corporation (NSFDC)
              </span>
            </div>

            <h1
              className="text-animated-shimmer"
              style={{
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 1.22,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Concessional Loans & Financial Assistance Portal
            </h1>

            <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
              Empowering Scheduled Caste citizens through accessible, transparent, and direct financial support. Explore concessional credit schemes, verify eligibility criteria, and connect with channel partners nationwide.
            </p>

            {/* Bouncy Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, paddingTop: 6 }}>
              <Link
                href="/chat"
                className="btn btn-amber btn-bounce"
                style={{
                  fontSize: 14.5,
                  padding: '12px 24px',
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={18} />
                <span>Talk to Assistant</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/schemes"
                className="btn btn-bounce"
                style={{
                  background: 'transparent',
                  border: '1.5px solid #ffffff',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14.5,
                  padding: '12px 24px',
                  borderRadius: 6,
                }}
              >
                <Layers size={18} color="#ffdcc2" />
                <span>Browse All Schemes</span>
              </Link>
            </div>

            {/* Official Trust Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, paddingTop: 10, fontSize: 12.5, color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#8dfc75" />
                <span>Official NSFDC Guidelines</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#8dfc75" />
                <span>Multilingual Support (EN / HI / MR)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#8dfc75" />
                <span>100+ Channel Partners</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: 3D Interactive Concessional Scheme Network */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                background: 'rgba(0, 24, 51, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 8,
                padding: '16px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 24, borderRadius: 2, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                    <EmblemOfIndia size={18} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e6eef8', letterSpacing: '0.02em' }}>
                    National Concessional Scheme Network
                  </span>
                </div>
                <span style={{ fontSize: 11, background: '#003366', color: '#ffdcc2', padding: '2px 8px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)' }}>
                  Interactive 3D
                </span>
              </div>

              {/* 3D Canvas */}
              <Hero3DCanvas />

              {/* Quick Assessment Launch */}
              <div
                style={{
                  marginTop: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#fe9832" />
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                    Dairy, Transport, MSME & Education assistance discovery
                  </span>
                </div>
                <Link
                  href="/chat"
                  className="btn btn-bounce"
                  style={{
                    background: '#fe9832',
                    color: '#001e40',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 4,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Test Match →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Bar (4 Elevated 3D Stat Pillars) ─────────────────────── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e4e2e1',
          padding: '36px 24px',
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
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Interactive3DCard
                key={s.label}
                maxTilt={6}
                style={{
                  background: '#fbf9f8',
                  border: '1px solid #e4e2e1',
                  borderRadius: 8,
                  padding: '20px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    background: '#e6eef8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 25, fontWeight: 800, color: '#001e40', lineHeight: 1.1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1b1c1c', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{s.sub}</div>
                </div>
              </Interactive3DCard>
            );
          })}
        </div>
      </section>

      {/* ── Core Services Section (4 Elevated 3D Cards) ──────────────────────── */}
      <section style={{ padding: '64px 24px', width: '100%', background: '#fbf9f8' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              className="badge badge-amber"
              style={{
                display: 'inline-block',
                width: 'fit-content',
                margin: '0 auto',
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Portal Services
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#001e40', margin: 0 }}>
              Essential Citizen Services
            </h2>
            <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.5, margin: 0 }}>
              Access direct tools to discover schemes, calculate interest, and connect with affiliated financial channels.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20,
            }}
          >
            {CORE_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Interactive3DCard
                  key={s.title}
                  maxTilt={6}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4e2e1',
                    borderRadius: 8,
                    padding: '26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 230,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          background: s.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} color={s.color} />
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: '#f6f3f2',
                          color: '#43474f',
                          border: '1px solid #e4e2e1',
                        }}
                      >
                        {s.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#001e40', margin: 0 }}>
                      {s.title}
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#43474f', lineHeight: 1.55, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>

                  <div style={{ paddingTop: 14, marginTop: 14, borderTop: '1px solid #f6f3f2' }}>
                    <Link
                      href={s.href}
                      className="text-link-hover"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: '#003366',
                        textDecoration: 'none',
                      }}
                    >
                      <span>{s.cta}</span>
                      <ChevronRight size={16} color="#8f4e00" />
                    </Link>
                  </div>
                </Interactive3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Schemes Showcase (3D Cards) ─────────────────────────────── */}
      <section
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e4e2e1',
          borderBottom: '1px solid #e4e2e1',
          padding: '60px 24px',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#003366', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Concessional Schemes
              </span>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#001e40', margin: '2px 0 0' }}>
                Featured Financial Assistance Programs
              </h2>
            </div>
            <Link
              href="/schemes"
              className="text-link-hover"
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#003366',
                textDecoration: 'none',
              }}
            >
              <span>View All Schemes</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {FEATURED_SCHEMES.map((scheme) => (
              <Interactive3DCard
                key={scheme.title}
                maxTilt={6}
                style={{
                  background: '#fbf9f8',
                  border: '1px solid #e4e2e1',
                  borderRadius: 8,
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 285,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: '#e6eef8',
                        color: '#003366',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {scheme.category}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d' }}>
                      {scheme.rate}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#001e40', marginBottom: 6, lineHeight: 1.3 }}>
                    {scheme.title}
                  </h3>
                  <p style={{ fontSize: 12.5, color: '#43474f', lineHeight: 1.5, marginBottom: 14 }}>
                    {scheme.desc}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e4e2e1',
                      borderRadius: 6,
                      padding: '9px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6,
                      marginBottom: 12,
                      fontSize: 11.5,
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Max Loan</span>
                      <strong style={{ color: '#1b1c1c', fontSize: 13 }}>{scheme.maxLoan}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Moratorium</span>
                      <strong style={{ color: '#1b1c1c', fontSize: 13 }}>{scheme.moratorium}</strong>
                    </div>
                  </div>

                  <Link
                    href={`/chat?scheme=${encodeURIComponent(scheme.title)}`}
                    className="btn btn-bounce"
                    style={{
                      width: '100%',
                      background: '#001e40',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '9px',
                      borderRadius: 6,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Check Eligibility</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </Interactive3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (4-Step Workflow) ───────────────────────────────────── */}
      <section
        style={{
          background: '#f6f3f2',
          borderBottom: '1px solid #e4e2e1',
          padding: '60px 24px',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              className="badge badge-navy"
              style={{
                display: 'inline-block',
                width: 'fit-content',
                margin: '0 auto',
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Application Process
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#001e40', margin: 0 }}>
              How It Works
            </h2>
            <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.5, margin: 0 }}>
              A structured, step-by-step workflow from discovery to loan disbursement through authorized channels.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {HOW_IT_WORKS.map(({ Icon, step, title, desc }) => (
              <Interactive3DCard
                key={step}
                maxTilt={5}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e2e1',
                  borderRadius: 8,
                  padding: '22px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      background: '#001e40',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#c3c6d1' }}>
                    0{step}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#001e40', margin: 0 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 12.5, color: '#43474f', lineHeight: 1.5, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              </Interactive3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px', width: '100%', background: '#fbf9f8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              background: '#001e40',
              color: '#ffffff',
              borderRadius: 8,
              padding: '40px 36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 28,
              border: '1px solid #003366',
              boxShadow: '0 12px 28px rgba(0, 30, 64, 0.2)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#ffdcc2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Direct Citizen Access
              </span>
              <h2 style={{ fontSize: 25, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Find the Concessional Scheme for Your Venture
              </h2>
              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
                Explore tailored loan options with verified interest rates and download scheme guidelines in English, Hindi, or Marathi.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
              <Link
                href="/chat"
                className="btn btn-amber btn-bounce"
                style={{
                  fontSize: 14,
                  padding: '12px 22px',
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={16} />
                <span>Launch Assistant</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/partners"
                className="btn btn-bounce"
                style={{
                  background: 'transparent',
                  border: '1.5px solid #ffffff',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '12px 20px',
                  borderRadius: 6,
                }}
              >
                <MapPin size={16} color="#ffdcc2" />
                <span>Find Partners</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
