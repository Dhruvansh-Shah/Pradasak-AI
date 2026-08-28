'use client';

import { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  MessageCircle,
  IndianRupee,
  Percent,
  Calendar,
  ShieldCheck,
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
}

const CATEGORY_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  micro_finance:     { label: 'Micro Finance',    bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  term_loan:         { label: 'Term Loan Scheme', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  education_loan:    { label: 'Education Loan',   bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
  entrepreneurship:  { label: 'Entrepreneurship', bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  skill_development: { label: 'Skill Dev',        bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
};

function SchemeCard({
  scheme,
  onChat,
}: {
  scheme: Scheme;
  onChat: (name: string) => void;
}) {
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
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(11,31,58,0.03)',
        transition: 'all 180ms ease',
        minHeight: 380,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#0b1f3a';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 8px 24px rgba(11,31,58,0.08)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#e2e8f0';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 2px 8px rgba(11,31,58,0.03)';
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Category & Women Only Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              background: meta.bg,
              color: meta.text,
              border: `1px solid ${meta.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
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
              Women Only
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0b1f3a', margin: 0, lineHeight: 1.35 }}>
          {scheme.name}
        </h3>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, margin: 0 }}>
          {scheme.description}
        </p>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
              Max Loan
            </span>
            <strong style={{ fontSize: 15, fontWeight: 800, color: '#0b1f3a' }}>
              ₹{scheme.max_loan_lakh} Lakh
            </strong>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
              Interest Rate
            </span>
            <strong style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>
              {scheme.interest_rate_min === scheme.interest_rate_max
                ? `${scheme.interest_rate_min}% p.a.`
                : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
            </strong>
          </div>
        </div>

        {/* Parameter Details */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5, color: '#64748b', paddingTop: 2 }}>
          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            Income limit: ≤ ₹{scheme.max_income_lakh}L/yr
          </span>
          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            Tenure: up to {scheme.max_tenure_months} mo
          </span>
          {scheme.moratorium_months_max > 0 && (
            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
              Moratorium: {scheme.moratorium_months_min}–{scheme.moratorium_months_max} mo
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={() => onChat(scheme.name)}
          style={{
            width: '100%',
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
          <span>Inquire with AI Assistant</span>
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
    if (search) {
      const q = search.toLowerCase();
      const m =
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      if (!m) return false;
    }
    if (catFilter.length > 0 && !catFilter.includes(s.category)) return false;
    if (genderFilter === 'women_only' && s.gender_eligibility !== 'women_only') return false;
    return true;
  });

  function toggleCat(c: string) {
    setCatFilter((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function resetFilters() {
    setCatFilter([]);
    setGenderFilter('all');
    setSearch('');
  }

  const hasActiveFilters = catFilter.length > 0 || genderFilter !== 'all' || search;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main className="page-content" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '36px 24px 64px', flex: 1 }}>
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Layers size={14} />
            <span>{t('schemes.badge', 'Official Schemes Catalog')}</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('schemes.title', 'Government Concessional Loan Schemes')}
          </h1>

          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 740, lineHeight: 1.6, margin: 0 }}>
            {t('schemes.desc', 'Explore official financial assistance programs tailored for Scheduled Caste beneficiaries with family income up to ₹5.00 Lakh per annum.')}
          </p>
        </div>

        {/* ── Search & Filter Toolbar ─────────────────────────────────────── */}
        <div
          className="filter-toolbar"
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
          <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
            
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
          <div className="scheme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
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
              No matching schemes found
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: 0 }}>
              Try searching with a broader keyword or clear your active category filters.
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
              Show All Schemes
            </button>
          </div>
        ) : (
          <div className="scheme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
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
