'use client';

import { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Percent,
  Calendar,
  MessageCircle
} from 'lucide-react';

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

const CATEGORY_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  micro_finance:     { label: 'Micro Finance',    bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  term_loan:         { label: 'Term Loan',        bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  education_loan:    { label: 'Education',        bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200' },
  entrepreneurship:  { label: 'Entrepreneurship', bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  skill_development: { label: 'Skill Dev',        bg: 'bg-pink-50',    text: 'text-pink-800',    border: 'border-pink-200' },
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
      label: scheme.category,
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
    };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      
      <div className="space-y-4">
        {/* Category & Tag */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
            {meta.label}
          </span>

          {scheme.gender_eligibility === 'women_only' && (
            <span className="text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">
              Women Only
            </span>
          )}
        </div>

        {/* Scheme Title */}
        <h3 className="font-extrabold text-lg text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
          {scheme.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {scheme.description}
        </p>

        {/* Key Parameter Boxes */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Max Amount</div>
            <div className="text-base font-extrabold text-[#0b1f3a]">
              ₹{scheme.max_loan_lakh} Lakh
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Interest Rate</div>
            <div className="text-base font-extrabold text-emerald-700">
              {scheme.interest_rate_min === scheme.interest_rate_max
                ? `${scheme.interest_rate_min}% p.a.`
                : `${scheme.interest_rate_min}–${scheme.interest_rate_max}%`}
            </div>
          </div>
        </div>

        {/* Extra Specs */}
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1">
          <span>Income limit: ≤ ₹{scheme.max_income_lakh}L/yr</span>
          <span>•</span>
          <span>Tenure: up to {scheme.max_tenure_months} mo</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-100 mt-6 flex items-center gap-3">
        <button
          onClick={() => onChat(scheme.name)}
          className="flex-1 bg-[#0b1f3a] hover:bg-[#132e54] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          Inquire with AI
        </button>
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [maxAmount, setMaxAmount] = useState(50);
  const [genderFilter, setGenderFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${BASE}/schemes`)
      .then((r) => r.json())
      .then((data: Scheme[]) => {
        if (Array.isArray(data)) {
          setSchemes(data);
          setFiltered(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let out = schemes;
    if (catFilter.length > 0) out = out.filter((s) => catFilter.includes(s.category));
    if (genderFilter !== 'all') {
      out = out.filter((s) => s.gender_eligibility === genderFilter || s.gender_eligibility === 'all');
    }
    out = out.filter((s) => s.max_loan_lakh <= maxAmount);
    if (search.trim()) {
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(out);
  }, [catFilter, maxAmount, genderFilter, search, schemes]);

  function toggleCat(cat: string) {
    setCatFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function resetFilters() {
    setCatFilter([]);
    setGenderFilter('all');
    setMaxAmount(50);
    setSearch('');
  }

  const hasActiveFilters =
    catFilter.length > 0 || genderFilter !== 'all' || maxAmount < 50 || search;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Layers className="w-3.5 h-3.5" />
            Official Schemes Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1f3a] tracking-tight">
            Government Concessional Loan Schemes
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
            Explore active schemes tailored for Scheduled Caste beneficiaries with family income up to ₹5 Lakh per annum.
          </p>
        </div>

        {/* ── Search & Filter Toolbar ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-8 space-y-4">
          
          {/* Top Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes by name, category, or purpose (e.g. Mahila, Transport, Education)..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#0b1f3a]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills & Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            
            {/* Category Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Category:
              </span>
              {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                const active = catFilter.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0b1f3a] text-white border-[#0b1f3a] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Gender Toggle & Reset */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setGenderFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    genderFilter === 'all' ? 'bg-white text-[#0b1f3a] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setGenderFilter('women_only')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    genderFilter === 'women_only' ? 'bg-white text-pink-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Women Only
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Scheme Grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 space-y-4">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No schemes found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try modifying your search term or clearing the active category filters.
            </p>
            <button
              onClick={resetFilters}
              className="btn-primary text-xs font-bold px-4 py-2"
            >
              Show All Schemes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
