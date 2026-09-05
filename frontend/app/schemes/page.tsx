'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Layers,
  ArrowRight,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Scheme {
  id: number;
  name: string;
  description: string;
  category: string;
  max_loan_lakh: number;
  min_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  max_income_lakh: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  gender_eligibility: string;
  active?: boolean;
  scheme_type?: string;
  official_source?: string | null;
  official_source_url?: string | null;
  aliases?: string[] | null;
  current_official_name?: string | null;
  channel_partner_applicable?: boolean;
}

const CATEGORY_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  micro_finance:     { label: 'Micro Finance',         bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  term_loan:         { label: 'Term Loan Scheme',      bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  education_loan:    { label: 'Education Loan',        bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
  entrepreneurship:  { label: 'Entrepreneurship',      bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  skill_development: { label: 'Skill Development',     bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
  other_programme:   { label: 'Government Programme', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

function SchemeCard({
  scheme,
  onChat,
}: {
  scheme: Scheme;
  onChat: (name: string) => void;
}) {
const { t } = useLanguage();
  const isInformational = scheme.scheme_type === 'informational' || scheme.channel_partner_applicable === false;
  const meta =
    CATEGORY_META[scheme.category] || {
      label: scheme.category.replace('_', ' '),
      bg: '#f8fafc',
      text: '#334155',
      border: '#e2e8f0',
    };

  return (
    <div
      style={{
        background: '#ffffff',
        border: isInformational ? '1.5px solid #cbd5e1' : '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(11,31,58,0.03)',
        transition: 'all 180ms ease',
        minHeight: 420,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#0b1f3a';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 8px 24px rgba(11,31,58,0.08)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isInformational ? '#cbd5e1' : '#e2e8f0';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 2px 8px rgba(11,31,58,0.03)';
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* ── Type Badge & Category ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          
          {isInformational ? (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🔵 OTHER GOVERNMENT PROGRAMME</span>
            </span>
          ) : (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🟢 FINANCING SCHEME</span>
            </span>
          )}

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 20,
              background: meta.bg,
              color: meta.text,
              border: `1px solid ${meta.border}`,
              textTransform: 'uppercase',
            }}
          >
            {meta.label}
          </span>

          {scheme.gender_eligibility === 'women_only' && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
                background: '#fdf2f8',
                color: '#be185d',
                border: '1px solid #fbcfe8',
                textTransform: 'uppercase',
              }}
            >
              {t('schemes.women_only', 'Women Only')}
            </span>
          )}
        </div>

        {/* ── Subtitle explanation ────────────────────────────────────────── */}
        <div style={{ fontSize: 11.5, color: isInformational ? '#2563eb' : '#059669', fontWeight: 600, marginTop: -4 }}>
          {isInformational
            ? 'Provides information about an official government programme. It is not part of the NSFDC channel-partner routing flow.'
            : 'May involve financing through an authorized channel partner.'}
        </div>

        {/* ── Scheme Title ────────────────────────────────────────────────── */}
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0b1f3a', margin: 0, lineHeight: 1.35 }}>
          {scheme.name}
        </h3>

        {/* ── Description ────────────────────────────────────────────────── */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, margin: 0 }}>
          {scheme.description}
        </p>

{/* ── Key Metrics Grid (For Financing Schemes) ─────────────────────── */}
        {!isInformational ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                {t('schemes.max_loan', 'Max Loan')}
              </span>
              <strong style={{ fontSize: 15, fontWeight: 800, color: '#0b1f3a' }}>
                ₹{scheme.max_loan_lakh} Lakh
              </strong>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                {t('schemes.interest_rate', 'Interest Rate')}
              </span>
              <strong style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>
                {scheme.interest_rate_min === scheme.interest_rate_max
                  ? `${scheme.interest_rate_min}% p.a.`
                  : `${scheme.interest_rate_min}–${scheme.interest_rate_max}% p.a.`}
              </strong>
            </div>
          </div>
        ) : scheme.max_loan_lakh > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                Bank Loan Range
              </span>
              <strong style={{ fontSize: 15, fontWeight: 800, color: '#0b1f3a' }}>
                ₹{scheme.min_loan_lakh}L – ₹{scheme.max_loan_lakh}L
              </strong>
            </div>

<div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                Disbursing Body
              </span>
              <strong style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
                Commercial Banks
              </strong>
            </div>
          </div>
        ) : null}

        {/* Parameter Details */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5, color: '#64748b', paddingTop: 2 }}>
          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            {t('schemes.income_limit', 'Income limit:')} ≤ ₹{scheme.max_income_lakh}L/yr
          </span>
          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            {t('schemes.tenure', 'Tenure: up to')} {scheme.max_tenure_months} mo
          </span>
          {scheme.moratorium_months_max > 0 && (
            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
              {t('schemes.moratorium', 'Moratorium:')} {scheme.moratorium_months_min}–{scheme.moratorium_months_max} mo
            </span>
          )}
        </div>

        {/* ── Official Source Citation ────────────────────────────────────── */}
        {scheme.official_source && (
          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            <span>Source:</span>
            {scheme.official_source_url ? (
              <a
                href={scheme.official_source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
              >
                {scheme.official_source} ↗
              </a>
            ) : (
              <span style={{ fontWeight: 600, color: '#64748b' }}>{scheme.official_source}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
        {isInformational && scheme.official_source_url && (
          <a
            href={scheme.official_source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 14px',
              borderRadius: 12,
              background: '#f1f5f9',
              color: '#0b1f3a',
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
          >
            <span>Learn More ↗</span>
          </a>
        )}

        <button
          onClick={() => onChat(scheme.name)}
          style={{
            flex: isInformational ? 1 : '1 1 100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 16px',
            borderRadius: 12,
            background: '#0b1f3a',
            color: '#ffffff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(11,31,58,0.18)',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#e87722';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#0b1f3a';
          }}
        >
          <MessageCircle size={15} color="#fbbf24" />
<span>{t('schemes.inquire_btn', 'Inquire with AI Assistant')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'financing' | 'informational'>('all');
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<'all' | 'women_only'>('all');

  useEffect(() => {
    fetch(`${BASE}/schemes`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setSchemes(d);
        } else if (Array.isArray(d?.schemes)) {
          setSchemes(d.schemes);
        } else {
          setSchemes([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setSchemes([]);
        setLoading(false);
      });
  }, []);

  const schemeList = Array.isArray(schemes) ? schemes : [];
  const filtered = schemeList.filter((s) => {
    const isInfo = s.scheme_type === 'informational' || s.channel_partner_applicable === false;
    if (typeFilter === 'financing' && isInfo) return false;
    if (typeFilter === 'informational' && !isInfo) return false;

    if (search) {
      const q = search.toLowerCase();
      const aliasMatch = (s.aliases || []).some((a) => a.toLowerCase().includes(q));
      const currentNameMatch = s.current_official_name ? s.current_official_name.toLowerCase().includes(q) : false;
      const m =
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        aliasMatch ||
        currentNameMatch;
      if (!m) return false;
    }
    if (catFilter.length > 0) {
      const isMatch = catFilter.some((cat) => {
        if (s.category === cat) return true;
        if (cat === 'entrepreneurship') {
          return s.category === 'entrepreneurship' || ['Term Loan (TL)', 'Udyam Nidhi Yojana (UNY)', 'Green Business Scheme (GBS)', 'Swachhta Udyami Yojana (SUY)', 'Mahila Adhikarita Yojana (MAY)', 'Stand-Up India Scheme'].includes(s.name);
        }
        if (cat === 'term_loan') {
          return s.category === 'term_loan' || ['Term Loan (TL)', 'Udyam Nidhi Yojana (UNY)', 'Green Business Scheme (GBS)', 'Swachhta Udyami Yojana (SUY)', 'Mahila Adhikarita Yojana (MAY)', 'Shilpi Samriddhi Yojana (SSY)'].includes(s.name);
        }
        if (cat === 'micro_finance') {
          return s.category === 'micro_finance' || ['Micro Credit Finance (MCF)', 'Mahila Samriddhi Yojana (MSY)', 'Aajeevika Microfinance Yojana (AMY)', 'Mahila Adhikarita Yojana (MAY)', 'Shilpi Samriddhi Yojana (SSY)'].includes(s.name);
        }
        if (cat === 'skill_development') {
          return s.category === 'skill_development' || s.name.includes('Vocational');
        }
        if (cat === 'other_programme') {
          return s.scheme_type === 'informational' || s.category === 'other_programme';
        }
        return false;
      });
      if (!isMatch) return false;
    }
    if (genderFilter === 'women_only' && s.gender_eligibility !== 'women_only') return false;
    return true;
  });

  function toggleCat(c: string) {
    setCatFilter((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function resetFilters() {
    setTypeFilter('all');
    setCatFilter([]);
    setGenderFilter('all');
    setSearch('');
  }

  const hasActiveFilters = typeFilter !== 'all' || catFilter.length > 0 || genderFilter !== 'all' || search;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '36px 24px 64px', flex: 1 }}>
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Layers size={14} />
            <span>{t('schemes.badge', 'Official Government Schemes & Programmes Catalogue')}</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('schemes.title', 'NSFDC Concessional Loan Schemes & Government Programmes')}
          </h1>

          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 780, lineHeight: 1.6, margin: 0 }}>
            {t('schemes.desc', 'Explore official financial assistance loan schemes and government welfare programmes for Scheduled Caste beneficiaries.')}
          </p>

          {/* Type Filter Segment Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setTypeFilter('all')}
              style={{
                fontSize: 13,
                fontWeight: typeFilter === 'all' ? 800 : 600,
                padding: '8px 18px',
                borderRadius: 12,
                border: typeFilter === 'all' ? '2px solid #0b1f3a' : '1.5px solid #cbd5e1',
                background: typeFilter === 'all' ? '#0b1f3a' : '#ffffff',
                color: typeFilter === 'all' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              All Programmes ({schemeList.length})
            </button>
            <button
              onClick={() => setTypeFilter('financing')}
              style={{
                fontSize: 13,
                fontWeight: typeFilter === 'financing' ? 800 : 600,
                padding: '8px 18px',
                borderRadius: 12,
                border: typeFilter === 'financing' ? '2px solid #059669' : '1.5px solid #a7f3d0',
                background: typeFilter === 'financing' ? '#ecfdf5' : '#ffffff',
                color: typeFilter === 'financing' ? '#065f46' : '#059669',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              🟢 Financing Schemes ({schemeList.filter(s => s.scheme_type !== 'informational' && s.channel_partner_applicable !== false).length})
            </button>
            <button
              onClick={() => setTypeFilter('informational')}
              style={{
                fontSize: 13,
                fontWeight: typeFilter === 'informational' ? 800 : 600,
                padding: '8px 18px',
                borderRadius: 12,
                border: typeFilter === 'informational' ? '2px solid #2563eb' : '1.5px solid #bfdbfe',
                background: typeFilter === 'informational' ? '#eff6ff' : '#ffffff',
                color: typeFilter === 'informational' ? '#1d4ed8' : '#2563eb',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              🔵 Informational Programmes ({schemeList.filter(s => s.scheme_type === 'informational' || s.channel_partner_applicable === false).length})
            </button>
          </div>
        </div>

        {/* ── Search & Filter Toolbar ─────────────────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '20px 24px',
            marginBottom: 32,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Top Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('schemes.search_ph', 'Search schemes by name, purpose, or activity (e.g. Mahila, Tailoring, Education, Green Business)...')}
              style={{
                width: '100%',
                padding: '13px 44px 13px 46px',
                borderRadius: 12,
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                fontSize: 14.5,
                fontWeight: 500,
                color: '#0f172a',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Chips & Gender Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
            
            {/* Category Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: 4 }}>
                {t('schemes.cat_label', 'Category:')}
              </span>
              {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                const active = catFilter.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    style={{
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      padding: '6px 14px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                      background: active ? '#0b1f3a' : '#f8fafc',
                      color: active ? '#ffffff' : '#334155',
                      boxShadow: active ? '0 2px 6px rgba(11,31,58,0.15)' : 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Gender Toggle & Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: 10 }}>
                <button
                  onClick={() => setGenderFilter('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: genderFilter === 'all' ? 700 : 500,
                    border: 'none',
                    background: genderFilter === 'all' ? '#ffffff' : 'transparent',
                    color: genderFilter === 'all' ? '#0b1f3a' : '#64748b',
                    boxShadow: genderFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t('schemes.all', 'All Schemes')}
                </button>
                <button
                  onClick={() => setGenderFilter('women_only')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: genderFilter === 'women_only' ? 700 : 500,
                    border: 'none',
                    background: genderFilter === 'women_only' ? '#ffffff' : 'transparent',
                    color: genderFilter === 'women_only' ? '#be185d' : '#64748b',
                    boxShadow: genderFilter === 'women_only' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t('schemes.women_only', 'Women Only')}
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#c2410c',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>{t('schemes.reset', 'Reset')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Scheme Grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 360, background: '#e2e8f0', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '64px 24px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Layers size={40} color="#cbd5e1" />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {t('schemes.empty_title', 'No matching schemes found')}
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: 0 }}>
              {t('schemes.empty_desc', 'Try searching with a broader keyword or clear your active category filters.')}
            </p>
            <button
              onClick={resetFilters}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: '#0b1f3a',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              {t('schemes.empty_btn', 'Show All Schemes')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {filtered.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onChat={(name) =>
                  router.push(`/chat?q=${encodeURIComponent(`Tell me about the ${name} scheme`)}`)
                }
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
