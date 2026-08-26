'use client';

import { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowRight, X } from 'lucide-react';

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

const CATEGORY_META: Record<string, { label: string; bg: string; text: string }> = {
  micro_finance:    { label: 'Micro Finance',   bg: '#eff6ff', text: '#1d4ed8' },
  term_loan:        { label: 'Term Loan',        bg: '#f0fdf4', text: '#15803d' },
  education_loan:   { label: 'Education',        bg: '#fdf4ff', text: '#7e22ce' },
  entrepreneurship: { label: 'Entrepreneur',    bg: '#fff7ed', text: '#c2410c' },
  skill_development:{ label: 'Skill Dev',        bg: '#fefce8', text: '#854d0e' },
};

const PAGE_SIZE = 6;

function SchemeCard({ scheme, delay, onChat }: { scheme: Scheme; delay: number; onChat: (name: string) => void }) {
  const meta = CATEGORY_META[scheme.category] || { label: scheme.category, bg: '#f8fafc', text: '#64748b' };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="scheme-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>
          {scheme.name}
        </h3>
        <span style={{
          background: meta.bg, color: meta.text,
          fontSize: 11, fontWeight: 600, padding: '3px 9px',
          borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {meta.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18, flex: 1 }}>
        {scheme.description?.slice(0, 110)}{(scheme.description?.length > 110) ? '…' : ''}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Max Assistance</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>₹{scheme.max_loan_lakh}L</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Interest Rate</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {scheme.interest_rate_min === scheme.interest_rate_max
              ? `${scheme.interest_rate_min}% p.a.`
              : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
          </div>
        </div>
      </div>

      <button
        onClick={() => onChat(scheme.name)}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          border: '1.5px solid var(--border)',
          background: 'white', color: 'var(--navy)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 200ms ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = 'var(--navy)';
          el.style.color = 'white';
          el.style.borderColor = 'var(--navy)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = 'white';
          el.style.color = 'var(--navy)';
          el.style.borderColor = 'var(--border)';
        }}
      >
        View Details
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [maxAmount, setMaxAmount] = useState(50);
  const [genderFilter, setGenderFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${BASE}/schemes`)
      .then(r => r.json())
      .then((data: Scheme[]) => {
        if (Array.isArray(data)) { setSchemes(data); setFiltered(data); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let out = schemes;
    if (catFilter.length > 0) out = out.filter(s => catFilter.includes(s.category));
    if (genderFilter !== 'all') out = out.filter(s => s.gender_eligibility === genderFilter || s.gender_eligibility === 'all');
    out = out.filter(s => s.max_loan_lakh <= maxAmount);
    if (search.trim()) out = out.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(out);
    setPage(1);
  }, [catFilter, maxAmount, genderFilter, search, schemes]);

  function toggleCat(cat: string) {
    setCatFilter(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  function resetFilters() {
    setCatFilter([]); setGenderFilter('all'); setMaxAmount(50); setSearch('');
  }

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const hasActiveFilters = catFilter.length > 0 || genderFilter !== 'all' || maxAmount < 50 || search;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .scheme-card {
          background: white; border-radius: 14px;
          border: 1px solid var(--border); padding: 22px;
          box-shadow: var(--shadow-sm);
          display: flex; flex-direction: column;
          opacity: 0; transform: translateY(20px);
          transition: opacity .45s ease, transform .45s ease, box-shadow .2s ease;
        }
        .scheme-card.in { opacity: 1; transform: translateY(0); }
        .scheme-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
        .scheme-card.in:hover { transform: translateY(-2px); }
      `}</style>

      <NavBar />

      <main style={{ flex: 1, background: 'var(--surface)', padding: '40px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div className="animate-fade-up" style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Loan Schemes
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em' }}>Available Schemes</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Browse and apply for financial assistance programs based on your eligibility.
            </p>
          </div>

          {/* Search bar */}
          <div className="animate-fade-up delay-100" style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by scheme name or description…"
              style={{
                width: '100%', padding: '12px 40px 12px 40px',
                borderRadius: 10, border: '1.5px solid var(--border)',
                fontSize: 14, background: 'white', color: 'var(--text)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Sidebar filters */}
            <aside
              className="animate-fade-up delay-150"
              style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 20px', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 80 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <SlidersHorizontal size={15} color="var(--text)" />
                  <h2 style={{ fontSize: 15, fontWeight: 700 }}>Filters</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Category</h3>
                {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                  <label
                    key={cat}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: 10, padding: '2px 0' }}
                  >
                    <input
                      type="checkbox"
                      checked={catFilter.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      style={{ accentColor: 'var(--navy)', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: catFilter.includes(cat) ? 'var(--navy)' : 'var(--text-secondary)', fontWeight: catFilter.includes(cat) ? 600 : 400, transition: 'color 150ms ease' }}>
                      {meta.label}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Eligibility</h3>
                {[{ value: 'all', label: 'All beneficiaries' }, { value: 'women_only', label: 'Women only' }].map(opt => (
                  <label
                    key={opt.value}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: 10 }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={genderFilter === opt.value}
                      onChange={() => setGenderFilter(opt.value)}
                      style={{ accentColor: 'var(--navy)', width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: genderFilter === opt.value ? 'var(--navy)' : 'var(--text-secondary)', fontWeight: genderFilter === opt.value ? 600 : 400, transition: 'color 150ms ease' }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Max Loan Amount</h3>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
                  Up to ₹{maxAmount} Lakh
                </div>
                <input
                  type="range"
                  min={1} max={50} value={maxAmount}
                  onChange={e => setMaxAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--navy)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  <span>₹1L</span><span>₹50L</span>
                </div>
              </div>
            </aside>

            {/* Scheme grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {loading ? 'Loading…' : <><strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> schemes found</>}
                </p>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 240, borderRadius: 14 }} />
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <Search size={32} style={{ marginBottom: 12, opacity: .3 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>No matching schemes</p>
                  <p style={{ fontSize: 13 }}>Try adjusting your filters or search term.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {paginated.map((scheme, i) => (
                    <SchemeCard
                      key={scheme.id}
                      scheme={scheme}
                      delay={i * 60}
                      onChat={name => router.push(`/chat?q=${encodeURIComponent(`Tell me about ${name}`)}`)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'white',
                      cursor: page === 1 ? 'default' : 'pointer',
                      opacity: page === 1 ? .4 : 1, fontSize: 13, fontWeight: 500,
                      color: 'var(--text)', transition: 'all 150ms ease',
                    }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: '1px solid', cursor: 'pointer',
                        borderColor: page === p ? 'var(--navy)' : 'var(--border)',
                        background: page === p ? 'var(--navy)' : 'white',
                        color: page === p ? 'white' : 'var(--text)',
                        fontWeight: page === p ? 700 : 400, fontSize: 13,
                        transition: 'all 150ms ease',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'white',
                      cursor: page === totalPages ? 'default' : 'pointer',
                      opacity: page === totalPages ? .4 : 1, fontSize: 13, fontWeight: 500,
                      color: 'var(--text)', transition: 'all 150ms ease',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
