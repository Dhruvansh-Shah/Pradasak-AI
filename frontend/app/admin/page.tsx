'use client';

import { useState, useEffect } from 'react';
import { adminLogin, adminGetSchemes, adminToggleScheme, adminGetPartners, adminTogglePartner, adminGetStats } from '@/lib/api';
import { Landmark, ArrowLeft, LogOut, RefreshCw } from 'lucide-react';
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
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{ background: active ? 'var(--accent)' : '#d1d5db' }}
    >
      <span
        className="inline-block h-3 w-3 rounded-full bg-white transition-transform"
        style={{ transform: active ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>NSFDC Admin</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Scheme & Partner Management</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin@2024"
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              required
            />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs mt-4 text-center" style={{ color: 'var(--muted)' }}>
          Default: admin@nsfdc.gov.in / Admin@2024
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<{ schemes: { total: number; active: number }; partners: { total: number; active: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    const savedEmail = sessionStorage.getItem('admin_email');
    if (saved && savedEmail) { setToken(saved); setAdminEmail(savedEmail); }
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
    try { setSchemes((await adminGetSchemes(token)) as Scheme[]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadPartners() {
    setLoading(true);
    try { setPartners((await adminGetPartners(token)) as Partner[]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!token) return;
    if (tab === 'schemes') loadSchemes();
    if (tab === 'partners') loadPartners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  async function toggleScheme(id: number) {
    await adminToggleScheme(token, id);
    setSchemes((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    setStats(await adminGetStats(token));
  }

  async function togglePartner(id: number) {
    await adminTogglePartner(token, id);
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p));
    setStats(await adminGetStats(token));
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const CATEGORY_LABELS: Record<string, string> = {
    micro_finance: 'Micro Finance', term_loan: 'Term Loan', education_loan: 'Education',
    entrepreneurship: 'Entrepreneur.', skill_development: 'Skill Dev.',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <h1 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>NSFDC Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{adminEmail}</span>
            <button onClick={logout} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'schemes', 'partners'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors"
              style={tab === t
                ? { background: 'var(--accent)', color: 'white' }
                : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Schemes', value: stats.schemes.total, color: '#3b82f6' },
                { label: 'Active Schemes', value: stats.schemes.active, color: '#10b981' },
                { label: 'Total Partners', value: stats.partners.total, color: '#8b5cf6' },
                { label: 'Active Partners', value: stats.partners.active, color: '#f59e0b' },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Quick Actions</h2>
              <div className="flex gap-2">
                <button onClick={() => setTab('schemes')} className="text-xs px-4 py-2 rounded-xl text-white" style={{ background: 'var(--accent)' }}>
                  Manage Schemes
                </button>
                <button onClick={() => setTab('partners')} className="text-xs px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  Manage Partners
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schemes */}
        {tab === 'schemes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                Schemes ({schemes.filter(s => s.active).length} active of {schemes.length})
              </h2>
              <button onClick={loadSchemes} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs">
                  <thead style={{ background: 'var(--surface)' }}>
                    <tr>
                      {['Name', 'Category', 'Interest', 'Max Loan', 'Income Limit', 'Gender', 'Active'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? 'var(--background)' : 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)', maxWidth: 200 }}>
                          <div className="truncate">{s.name}</div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{CATEGORY_LABELS[s.category] || s.category}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{s.interest_rate_min}%</td>
                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>₹{s.max_loan_lakh}L</td>
                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>₹{s.max_income_lakh}L</td>
                        <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{s.gender_eligibility === 'women_only' ? '👩 Women' : 'All'}</td>
                        <td className="px-4 py-3">
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

        {/* Partners */}
        {tab === 'partners' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                Partners ({partners.filter(p => p.is_active).length} active of {partners.length})
              </h2>
              <button onClick={loadPartners} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs">
                  <thead style={{ background: 'var(--surface)' }}>
                    <tr>
                      {['Name', 'Type', 'City', 'NPA %', 'Fund Status', 'Active'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p, i) => {
                      const fc = { available: '#10b981', limited: '#f59e0b', exhausted: '#ef4444' }[p.fund_availability_status] || '#6b7280';
                      return (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--background)' : 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)', maxWidth: 200 }}>
                            <div className="truncate">{p.name}</div>
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{p.partner_type}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{p.city}, {p.state}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{p.npa_percent ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: fc + '1a', color: fc }}>
                              {p.fund_availability_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
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
      </div>
    </div>
  );
}
