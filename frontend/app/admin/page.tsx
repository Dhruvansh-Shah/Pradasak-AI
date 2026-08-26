'use client';

import { useState, useEffect } from 'react';
import {
  adminLogin,
  adminGetSchemes,
  adminToggleScheme,
  adminGetPartners,
  adminTogglePartner,
  adminGetStats,
} from '@/lib/api';
import { Landmark, ArrowLeft, LogOut, RefreshCw, Layers, ShieldCheck, Building2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Scheme {
  id: number;
  name: string;
  category: string;
  interest_rate_min: number;
  max_loan_lakh: number;
  max_income_lakh: number;
  gender_eligibility: string;
  active: boolean;
}

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  city: string;
  state: string;
  fund_availability_status: string;
  npa_percent: number | null;
  is_active: boolean;
}

type Tab = 'overview' | 'schemes' | 'partners';

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        active ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function LoginForm({ onLogin }: { onLogin: (token: string, email: string) => void }) {
  const [email, setEmail] = useState('admin@nsfdc.gov.in');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, email: em } = await adminLogin(email, password);
      onLogin(token, em);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0b1f3a] text-amber-400 flex items-center justify-center shadow-md">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900">NSFDC Admin Portal</h1>
            <p className="text-xs text-slate-500">Scheme &amp; Channel Partner Governance</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-sm font-bold shadow-md cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Authenticating…' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Demo credentials: <code>admin@nsfdc.gov.in</code> / <code>Admin@2024</code>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<{
    schemes: { total: number; active: number };
    partners: { total: number; active: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    const savedEmail = sessionStorage.getItem('admin_email');
    if (saved && savedEmail) {
      setToken(saved);
      setAdminEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    adminGetStats(token).then(setStats).catch(console.error);
  }, [token]);

  function handleLogin(t: string, em: string) {
    setToken(t);
    setAdminEmail(em);
    sessionStorage.setItem('admin_token', t);
    sessionStorage.setItem('admin_email', em);
  }

  function logout() {
    setToken('');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
  }

  async function loadSchemes() {
    setLoading(true);
    try {
      setSchemes((await adminGetSchemes(token)) as Scheme[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPartners() {
    setLoading(true);
    try {
      setPartners((await adminGetPartners(token)) as Partner[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (tab === 'schemes') loadSchemes();
    if (tab === 'partners') loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  async function toggleScheme(id: number) {
    await adminToggleScheme(token, id);
    setSchemes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    setStats(await adminGetStats(token));
  }

  async function togglePartner(id: number) {
    await adminTogglePartner(token, id);
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
    setStats(await adminGetStats(token));
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const CATEGORY_LABELS: Record<string, string> = {
    micro_finance: 'Micro Finance',
    term_loan: 'Term Loan',
    education_loan: 'Education',
    entrepreneurship: 'Entrepreneur.',
    skill_development: 'Skill Dev.',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Admin Header */}
      <header className="bg-[#0b1f3a] text-white border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
            </Link>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h1 className="text-sm sm:text-base font-extrabold text-white">
                Admin Management Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 hidden sm:inline">{adminEmail}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-200 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          {(['overview', 'schemes', 'partners'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                tab === t
                  ? 'bg-[#0b1f3a] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Total Schemes', value: stats.schemes.total, sub: `${stats.schemes.active} active`, color: 'text-blue-600' },
                { label: 'Active Schemes', value: stats.schemes.active, sub: 'Currently matching in AI', color: 'text-emerald-600' },
                { label: 'Total Partners', value: stats.partners.total, sub: `${stats.partners.active} active`, color: 'text-purple-600' },
                { label: 'Active Partners', value: stats.partners.active, sub: 'Eligible for routing', color: 'text-amber-600' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className={`text-3xl sm:text-4xl font-black ${s.color} mb-1`}>
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800">{s.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Administrative Shortcuts</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTab('schemes')}
                  className="btn-primary text-xs font-bold px-5 py-2.5"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  Manage Scheme Catalog
                </button>
                <button
                  onClick={() => setTab('partners')}
                  className="btn-outline text-xs font-bold px-5 py-2.5"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Manage Channel Partners
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schemes */}
        {tab === 'schemes' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Loan Schemes Catalog
                </h2>
                <p className="text-xs text-slate-500">
                  {schemes.filter((s) => s.active).length} active of {schemes.length} total
                </p>
              </div>

              <button
                onClick={loadSchemes}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading catalog…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Scheme Name</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Interest</th>
                      <th className="px-5 py-3.5">Max Loan</th>
                      <th className="px-5 py-3.5">Income Cap</th>
                      <th className="px-5 py-3.5">Eligibility</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schemes.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 max-w-xs truncate">
                          {s.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {CATEGORY_LABELS[s.category] || s.category}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {s.interest_rate_min}%
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          ₹{s.max_loan_lakh}L
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          ₹{s.max_income_lakh}L
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {s.gender_eligibility === 'women_only' ? '👩 Women Only' : 'All SC'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Toggle active={s.active} onToggle={() => toggleScheme(s.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Partners */}
        {tab === 'partners' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Channel Partner Directory
                </h2>
                <p className="text-xs text-slate-500">
                  {partners.filter((p) => p.is_active).length} active of {partners.length} total
                </p>
              </div>

              <button
                onClick={loadPartners}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading partners…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Agency / Bank Name</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Location</th>
                      <th className="px-5 py-3.5">NPA %</th>
                      <th className="px-5 py-3.5">Fund Status</th>
                      <th className="px-5 py-3.5 text-right">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map((p) => {
                      const fc =
                        {
                          available: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          limited: 'bg-amber-50 text-amber-800 border-amber-200',
                          exhausted: 'bg-red-50 text-red-800 border-red-200',
                        }[p.fund_availability_status] ||
                        'bg-slate-50 text-slate-700 border-slate-200';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900 max-w-xs truncate">
                            {p.name}
                          </td>
                          <td className="px-5 py-4 text-slate-600 font-semibold">{p.partner_type}</td>
                          <td className="px-5 py-4 text-slate-500">
                            {p.city}, {p.state}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-700">
                            {p.npa_percent != null ? `${p.npa_percent}%` : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold border ${fc}`}>
                              {p.fund_availability_status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Toggle active={p.is_active} onToggle={() => togglePartner(p.id)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
