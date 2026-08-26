'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  MessageCircle,
  Calculator,
  MapPin,
  ArrowRight,
  UserCheck,
  FileSearch,
  PenLine,
  Banknote,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Scale,
  TrendingDown,
  Building2
} from 'lucide-react';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const CORE_SERVICES = [
  {
    icon: MessageCircle,
    color: '#0b1f3a',
    bg: '#eff6ff',
    badge: 'Multilingual AI',
    title: 'Grounded Scheme Recommender',
    desc: 'Describe your business or educational goal in any language. Our grounded AI pipeline matches and ranks official schemes without halluncinating rates.',
    href: '/chat',
    cta: 'Start Conversation',
  },
  {
    icon: Calculator,
    color: '#e87722',
    bg: '#fff7ed',
    badge: 'Accurate Math',
    title: 'Moratorium & EMI Calculator',
    desc: 'Deterministic calculation for tiered interest (4%–8%), moratorium interest accrual (3–12 months), and repayment schedules for your exact budget.',
    href: '/chat?tab=emi',
    cta: 'Calculate EMI',
  },
  {
    icon: MapPin,
    color: '#15803d',
    bg: '#f0fdf4',
    badge: 'PostGIS Spatial',
    title: 'Healthy Channel Partner Locator',
    desc: 'Locate 100+ State Agencies (SCAs), Rural Banks (RRBs), and MFIs filtered by real-time NPA health, scheme eligibility, and proximity.',
    href: '/partners',
    cta: 'Find Nearby Partners',
  },
  {
    icon: ShieldCheck,
    color: '#7e22ce',
    bg: '#fdf4ff',
    badge: 'Direct Verification',
    title: 'Eligibility & Document Engine',
    desc: 'Instant verification rules for caste certificates, income threshold (≤ ₹5L/yr), project reports, and necessary identity proofs.',
    href: '/schemes',
    cta: 'Browse Catalog',
  },
];

const HOW_IT_WORKS = [
  {
    Icon: MessageCircle,
    step: '01',
    title: 'Tell Us Your Needs',
    desc: 'Chat in Hindi, Marathi, or English about your loan purpose and family income.',
  },
  {
    Icon: Scale,
    step: '02',
    title: 'AI Matches Schemes',
    desc: 'We query the active catalog and compare loan caps, subsidies, and interest terms.',
  },
  {
    Icon: Calculator,
    step: '03',
    title: 'Plan Your Repayment',
    desc: 'Review exact monthly EMIs with tailored grace periods before committing.',
  },
  {
    Icon: Building2,
    step: '04',
    title: 'Connect to Partner',
    desc: 'Direct contact info for the nearest financially healthy Channel Partner to submit docs.',
  },
];

const STATS = [
  { value: '15+', label: 'Concessional Schemes', sub: 'Micro-credit to ₹50L loans' },
  { value: '4% – 8%', label: 'Subsidized Interest', sub: 'Far lower than market rates' },
  { value: '100+', label: 'Channel Partners', sub: 'SCAs, PSBs, RRBs & MFIs' },
  { value: 'Up to 90%', label: 'Project Cost Coverage', sub: 'Govt. backed assistance' },
];

export default function HomePage() {
  const servicesRef = useReveal();
  const howRef = useReveal();
  const statsRef = useReveal();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <style>{`
        .reveal-section {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-section.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <NavBar />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1f3a] via-[#102a4c] to-[#0b1f3a] text-white pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                National SC Finance &amp; Development Corporation
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white">
              Concessional Loans &amp; Finance,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Made Simple &amp; Grounded
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Discover official government assistance programs, compute accurate monthly EMIs with moratorium support, and find verified channel partners near you without bureaucratic confusion.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/chat"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/25 flex items-center gap-2.5 transition-all text-sm sm:text-base cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                Talk to AI Assistant
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/schemes"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl backdrop-blur-sm transition-all text-sm sm:text-base cursor-pointer"
              >
                Browse All Schemes
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Hallucinations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Multilingual Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Partners</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Live Card & Highlights */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Interactive Assistant</h3>
                    <p className="text-xs text-slate-300">Live Scheme Recommendation</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>

              {/* Chat Simulation Preview */}
              <div className="space-y-3">
                <div className="bg-white/15 rounded-xl p-3 text-xs text-slate-200 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block mb-1">Applicant:</span>
                  "I want to open a small grocery shop in Lucknow. Family earns ₹2.8 Lakh/year. What scheme can I get?"
                </div>
                <div className="bg-[#0b1f3a]/80 rounded-xl p-3.5 text-xs text-slate-100 border border-white/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Recommended: Term Loan Scheme</span>
                    <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">7% p.a.</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Covers up to 90% project cost with a 6-month moratorium. Nearest eligible SCA: <strong>UP Scheduled Castes Finance &amp; Dev. Corp.</strong>
                  </p>
                </div>
              </div>

              {/* Action */}
              <Link
                href="/chat"
                className="w-full bg-white text-[#0b1f3a] hover:bg-slate-100 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow"
              >
                Try With Your Own Details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Showcase ────────────────────────────────────────────── */}
      <section className="relative -mt-10 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md flex flex-col justify-between"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] mb-1">
                {s.value}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">{s.label}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Services Section ───────────────────────────────────────────── */}
      <section ref={servicesRef} className="reveal-section py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-extrabold tracking-widest text-amber-600 uppercase">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1f3a] tracking-tight">
            Designed for Transparency &amp; Speed
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Eliminating intermediate confusion with grounded AI, accurate loan math, and geo-spatial channel routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CORE_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"
                      style={{ background: s.bg }}
                    >
                      <Icon className="w-7 h-7" style={{ color: s.color }} />
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full border"
                      style={{ background: s.bg, color: s.color, borderColor: `${s.color}30` }}
                    >
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {s.desc}
                  </p>
                </div>

                <Link
                  href={s.href}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1f3a] hover:text-amber-600 transition-colors pt-4 border-t border-slate-100"
                >
                  {s.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works Section ────────────────────────────────────────────── */}
      <section ref={howRef} className="reveal-section bg-slate-100/70 border-y border-slate-200 py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-extrabold tracking-widest text-amber-600 uppercase">
              Simple 4-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1f3a] tracking-tight">
              From Inquiry to Disbursement
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              How Pradarshak AI guides an applicant directly to the right channel partner with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ Icon, step, title, desc }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0b1f3a] text-white flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-2xl font-black text-slate-300 tracking-tight font-mono">
                      {step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-[#0b1f3a] to-[#153461] text-white rounded-3xl p-8 sm:p-14 lg:p-16 shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-10">
          
          <div className="space-y-4 max-w-2xl">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              Get Started Now
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to find the loan scheme that fits you?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Chat with our AI assistant in Hindi, Marathi, or English. It takes less than 2 minutes to discover your eligibility and nearest partner.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-shrink-0">
            <Link
              href="/chat"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              Launch Assistant
            </Link>
            <Link
              href="/partners"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-4 rounded-xl backdrop-blur-sm transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-amber-400" />
              Find Partners
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
