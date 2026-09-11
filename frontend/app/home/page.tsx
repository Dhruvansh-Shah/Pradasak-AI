'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import KeyLeadership from '@/components/KeyLeadership';
import StorytellingCarousel from '@/components/StorytellingCarousel';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSchemeName, getLocalizedSchemeDesc } from '@/lib/translations';
import {
  MessageCircle,
  Calculator,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function PortalOverviewPage() {
  const { t, language } = useLanguage();
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const rotatingMessages = useMemo(() => [
    t('home.rotate_msg_1', 'Explore government-supported concessional loan schemes and financial assistance.'),
    t('home.rotate_msg_2', 'Check your eligibility and discover schemes suited to your needs.'),
    t('home.rotate_msg_3', 'Understand loan terms, interest rates, and repayment options.'),
    t('home.rotate_msg_4', 'Calculate your estimated monthly EMI with ease.'),
    t('home.rotate_msg_5', 'Find channel partners available near you.'),
    t('home.rotate_msg_6', 'Get assistance through the PradarshakAI AI Assistant.'),
    t('home.rotate_msg_7', 'Access scheme information in a simple and transparent way.'),
    t('home.rotate_msg_8', 'Connect with channel partners and understand the next steps.'),
  ], [t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentMsgIndex((prev) => (prev + 1) % rotatingMessages.length);
        setFade(true);
      }, 500);
    }, 4500);

    return () => clearInterval(timer);
  }, [rotatingMessages.length]);

  const featuredSchemes = useMemo(() => [
    {
      title: getLocalizedSchemeName('Mahila Samriddhi Yojana (MSY)', language),
      category: t('home.featured_cat_micro', t('category.micro_finance', 'Micro Finance')),
      rate: '4% p.a.',
      maxLoan: '₹1.40 Lakh',
      tenure: '3.5 Years',
      moratorium: '3 Months',
      desc: t('home.featured_msy_desc', getLocalizedSchemeDesc('Mahila Samriddhi Yojana (MSY)', 'Micro-credit assistance program for women entrepreneurs in petty trade, tailoring, dairy, and artisanal crafts.', language)),
    },
    {
      title: getLocalizedSchemeName('Term Loan Scheme', language),
      category: t('home.featured_cat_term', t('category.term_loan', 'Term Loan')),
      rate: '6% – 8% p.a.',
      maxLoan: '₹50.00 Lakh',
      tenure: '5 – 10 Years',
      moratorium: '6 – 12 Months',
      desc: t('home.featured_term_desc', getLocalizedSchemeDesc('Term Loan Scheme', 'Project financing for viable ventures in manufacturing, agricultural machinery, transport, and service sectors.', language)),
    },
    {
      title: getLocalizedSchemeName('Education Loan Scheme (ELS)', language),
      category: t('home.featured_cat_edu', t('category.education_loan', 'Education Loan')),
      rate: '4% p.a.',
      maxLoan: '₹20.00 Lakh',
      tenure: '5 Years post study',
      moratorium: 'Course + 6m',
      desc: t('home.featured_edu_desc', getLocalizedSchemeDesc('Education Loan Scheme (ELS)', 'Concessional education credit for professional and technical higher education courses in India and abroad.', language)),
    },
  ], [t, language]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F6F8', color: '#1e293b' }}>
      <NavBar />

      {/* ── CLEAN OFFICIAL HERO SECTION WITH VISUAL STORYTELLING ────────── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 0 10px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: 840,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          {/* Hero Heading */}
          <h1
            style={{
              fontSize: 'clamp(22px, 2.6vw, 32px)',
              fontWeight: 800,
              color: '#003366',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
            }}
          >
            {t('home.hero_title', 'Find the Right Government Financial Scheme')}
          </h1>

          {/* Rotating Informational Text */}
          <div
            style={{
              minHeight: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 720,
              padding: '0 16px',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(13.5px, 1.5vw, 15.5px)',
                fontWeight: 500,
                color: '#0b5a8f',
                margin: 0,
                lineHeight: 1.35,
                textAlign: 'center',
                opacity: fade ? 1 : 0,
                transform: fade ? 'translateY(0)' : 'translateY(2px)',
                transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {rotatingMessages[currentMsgIndex % rotatingMessages.length]}
            </p>
          </div>
        </div>

        {/* ── 7-IMAGE STORYTELLING CAROUSEL ── */}
        <div style={{ width: '100%', marginTop: '8px' }}>
          <StorytellingCarousel />
        </div>
      </section>

      {/* ── QUICK SERVICES SECTION ────────────────────────────────────────── */}
      <section style={{ padding: '48px 24px 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#003366', margin: '0 0 12px 0' }}>
            {t('home.services_title', 'What would you like to do?')}
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
            {t('home.services_sub', t('home.services_subtitle', 'Select an option below to get started with PradarshakAI'))}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
          {/* Card 1: Explore Schemes */}
          <Link href="/schemes" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={32} color="#003366" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0' }}>
                  {t('home.services_schemes_title', t('home.card_explore_title', t('nav.schemes', 'Explore Schemes')))}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                  {t('home.services_schemes_desc', t('home.card_explore_desc', 'View available concessional loan schemes'))}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Check Eligibility */}
          <Link href="/chat" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={32} color="#003366" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0' }}>
                  {t('home.services_eligibility_title', t('home.card_eligibility_title', 'Check Eligibility'))}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                  {t('home.services_eligibility_desc', t('home.card_eligibility_desc', 'Find schemes you may be eligible for'))}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Calculate EMI */}
          <Link href="/chat?tab=emi" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={32} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0' }}>
                  {t('home.services_emi_title', t('home.card_emi_title', 'Calculate EMI'))}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                  {t('home.services_emi_desc', t('home.card_emi_desc', 'Estimate your monthly repayment'))}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Find a Partner */}
          <Link href="/partners" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={32} color="#15803d" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0' }}>
                  {t('home.services_partner_title', t('home.card_partner_title', 'Find a Partner'))}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
                  {t('home.services_partner_desc', t('home.card_partner_desc', 'Locate nearby channel partners'))}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── FEATURED SCHEMES ────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#003366', margin: '0 0 12px 0' }}>
                {t('home.featured_title', 'Featured Schemes')}
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
                {t('home.featured_sub', t('home.featured_subtitle', 'Popular concessional loan programs'))}
              </p>
            </div>
            <Link href="/schemes" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0B5A8F', fontWeight: 600, textDecoration: 'none' }}>
              <span>{t('home.view_all_schemes', 'View All Schemes')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {featuredSchemes.map((scheme, idx) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, background: '#F5F6F8' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#003366', margin: '0 0 4px 0' }}>{scheme.title}</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F58220', textTransform: 'uppercase' }}>{scheme.category}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      {t('home.max_assistance', 'Max Assistance')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0B5A8F' }}>{scheme.maxLoan}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      {t('schemes.interest_rate', t('home.interest_rate', 'Interest Rate'))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{scheme.rate}</div>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5, flex: 1 }}>
                  {scheme.desc}
                </p>

                <Link href="/schemes" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#003366', fontWeight: 700, textDecoration: 'none', marginTop: 8 }}>
                  <span>{t('home.view_details', 'View Details')}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMPLE 3-STEP PROCESS ────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#003366', margin: '0 0 40px 0' }}>
          {t('home.how_helps_title', 'How PradarshakAI Helps')}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#003366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>1</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B5A8F', margin: 0 }}>
              {t('home.step1_title', t('home.how_step1_title', 'Check Eligibility'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {t('home.step1_desc', t('home.how_step1_desc', 'Provide your project purpose and income to instantly verify your eligibility.'))}
            </p>
          </div>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#003366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>2</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B5A8F', margin: 0 }}>
              {t('home.step2_title', t('home.how_step2_title', 'Find a Suitable Scheme'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {t('home.step2_desc', t('home.how_step2_desc', 'Our system identifies the best concessional programs with the lowest subsidized interest rates.'))}
            </p>
          </div>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#003366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>3</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B5A8F', margin: 0 }}>
              {t('home.step3_title', t('home.how_step3_title', 'Connect & Apply'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {t('home.step3_desc', t('home.how_step3_desc', 'Connect directly to your nearest State Channelising Agency or nominated bank branch.'))}
            </p>
          </div>
        </div>
      </section>

      {/* ── HELP / AI ASSISTANT SECTION ───────────────────────────────────── */}
      <section style={{ padding: '0 24px 64px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', background: '#003366', borderRadius: 12, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, boxShadow: '0 10px 25px rgba(0, 51, 102, 0.15)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {t('home.need_help_title', 'Need Help?')}
          </h2>
          <p style={{ fontSize: 16, color: '#cbd5e1', margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
            {t('home.need_help_desc', 'Get assistance finding schemes, understanding eligibility, or calculating your repayment.')}
          </p>
          <Link
            href="/chat"
            style={{
              background: '#F58220',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
            }}
          >
            <MessageCircle size={18} />
            <span>{t('home.ask_ai_assistant', 'Ask AI Assistant')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Key Leadership ──────────────────────────────────────────────────── */}
      <KeyLeadership />

      <Footer />
    </div>
  );
}
