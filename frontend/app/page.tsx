'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { MessageCircle, CheckSquare, Calculator, MapPin, ArrowRight, UserCheck, FileSearch, PenLine, Banknote } from 'lucide-react';

// Intersection observer hook for scroll animations
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const CORE_SERVICES = [
  {
    icon: MessageCircle,
    title: 'Scheme Recommendation',
    desc: 'Describe your situation in plain language and receive ranked loan scheme matches with eligibility reasoning.',
    href: '/chat',
  },
  {
    icon: CheckSquare,
    title: 'Eligibility Check',
    desc: 'Instantly verify your qualification for specific schemes based on income, caste certificate, and purpose.',
    href: '/chat',
  },
  {
    icon: Calculator,
    title: 'EMI Calculator',
    desc: 'Compute monthly repayments for any scheme with moratorium, tenure, and interest rate breakdowns.',
    href: '/chat',
  },
  {
    icon: MapPin,
    title: 'Partner Locator',
    desc: 'Find the nearest active channel partners — state agencies, rural banks, and MFIs near your location.',
    href: '/partners',
  },
];

const HOW_IT_WORKS = [
  { Icon: UserCheck,  step: '01', title: 'Create Profile', desc: 'Register with your Aadhaar-linked details. Verification is instant.' },
  { Icon: FileSearch, step: '02', title: 'Discover Schemes', desc: 'Our assistant matches your profile against all active NSFDC schemes.' },
  { Icon: PenLine,    step: '03', title: 'Submit Application', desc: 'Complete the digital form and upload required documents securely.' },
  { Icon: Banknote,   step: '04', title: 'Receive Funds', desc: 'Track disbursement status and receive direct benefit to your account.' },
];

const STATS = [
  { value: '15+', label: 'Active Schemes' },
  { value: '100+', label: 'Channel Partners' },
  { value: '₹50L', label: 'Max Loan Amount' },
  { value: '4%', label: 'Lowest Interest Rate' },
];

function ServiceCard({ icon: Icon, title, desc, href, delay }: typeof CORE_SERVICES[0] & { delay: number }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="card-hover animate-fade-up"
        style={{
          background: 'white', borderRadius: 14, padding: '28px 24px',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer', height: '100%',
          animationDelay: `${delay}ms`, animationFillMode: 'both',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--navy-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 18,
          transition: 'background 200ms ease',
        }}>
          <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--text)', lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          {desc}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, color: 'var(--navy)', fontSize: 12, fontWeight: 600 }}>
          Learn more <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const servicesRef = useReveal();
  const howRef = useReveal();
  const statsRef = useReveal();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .reveal-section { opacity: 0; transform: translateY(28px); transition: opacity .6s ease, transform .6s ease; }
        .reveal-section.revealed { opacity: 1; transform: translateY(0); }
        .step-card { opacity: 0; transform: translateY(20px); transition: opacity .5s ease, transform .5s ease; }
        .step-card.visible { opacity: 1; transform: translateY(0); }
        .stat-item { opacity: 0; transform: translateY(16px); transition: opacity .4s ease, transform .4s ease; }
        .stat-item.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <NavBar />

      {/* Hero */}
      <section style={{ background: 'var(--background)', padding: '72px 24px 60px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 440px', gap: 64, alignItems: 'center' }}>
          <div>
            <div
              className="animate-fade-up"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy-light)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--navy)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', letterSpacing: '.02em' }}>
                National SC Finance &amp; Development Corporation
              </span>
            </div>

            <h1
              className="animate-fade-up delay-100"
              style={{ fontSize: 42, fontWeight: 800, color: 'var(--text)', lineHeight: 1.18, marginBottom: 22, letterSpacing: '-.02em' }}
            >
              Find the financial<br />
              assistance that&apos;s<br />
              right for you
            </h1>

            <p
              className="animate-fade-up delay-200"
              style={{ fontSize: 15.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}
            >
              Empowering Scheduled Caste beneficiaries through accessible, transparent, and direct financial support. Explore schemes, check eligibility, and apply seamlessly.
            </p>

            <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/chat"
                className="btn-primary"
                style={{ padding: '13px 24px', fontSize: 14 }}
              >
                <MessageCircle size={16} strokeWidth={2} />
                Talk to Assistant
              </Link>
              <Link
                href="/schemes"
                className="btn-outline"
                style={{ padding: '13px 24px', fontSize: 14 }}
              >
                Browse Schemes
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Stats panel */}
          <div className="animate-fade-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{
              background: 'var(--navy)', borderRadius: 18, padding: '32px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 24 }}>
                Platform Overview
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '18px 16px',
                      border: '1px solid rgba(255,255,255,.1)',
                      animationDelay: `${300 + i * 80}ms`,
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 6 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, lineHeight: 1.6 }}>
                  Scheme data verified against official NSFDC guidelines. For SC/ST beneficiaries with family income ≤ ₹5 lakh per annum.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

      {/* Core Services */}
      <section ref={servicesRef} className="reveal-section" style={{ background: 'var(--surface)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Core Services
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 12 }}>
              Everything you need in one place
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, maxWidth: 520, lineHeight: 1.7 }}>
              Access essential tools to manage your financial assistance journey — from discovery to disbursement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {CORE_SERVICES.map((s, i) => (
              <ServiceCard key={s.title} {...s} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howRef} className="reveal-section" style={{ background: 'white', padding: '72px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56, maxWidth: 560 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              How It Works
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 12 }}>
              A streamlined path to financial support
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7 }}>
              Our four-step process ensures you reach the right scheme and receive funds without unnecessary delays.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            {/* Connector line */}
            <div style={{
              position: 'absolute', top: 28, left: '12.5%', right: '12.5%',
              height: 1, background: 'var(--border)', zIndex: 0,
            }} />

            {HOW_IT_WORKS.map(({ Icon, step, title, desc }, i) => (
              <div
                key={step}
                className="animate-fade-up"
                style={{ padding: '0 20px', position: 'relative', zIndex: 1, animationDelay: `${i * 120}ms`, animationFillMode: 'both' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--navy)', border: '3px solid white',
                  boxShadow: 'var(--shadow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <Icon size={22} color="white" strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', marginBottom: 6 }}>STEP {step}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{
        padding: '60px 24px',
        background: 'linear-gradient(135deg, var(--navy) 0%, #162f5e 100%)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,.06)', top: -80, left: -60, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,.06)', bottom: -50, right: 80, pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Get Started Today
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em', lineHeight: 1.2 }}>
            Ready to find your scheme?
          </h2>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.65)', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Our AI assistant will guide you through eligibility, scheme selection, and application — in Hindi, Marathi, or English.
          </p>
          <Link
            href="/chat"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--orange)', color: 'white',
              padding: '14px 32px', borderRadius: 10,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
              boxShadow: '0 4px 20px rgba(232,119,34,.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(232,119,34,.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(232,119,34,.35)';
            }}
          >
            Start Now — It's Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
