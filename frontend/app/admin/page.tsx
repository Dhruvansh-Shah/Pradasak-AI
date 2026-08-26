'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  adminLogin,
  adminGetSchemes,
  adminToggleScheme,
  adminGetPartners,
  adminTogglePartner,
  adminGetStats,
} from '@/lib/api';
import {
  Landmark,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Layers,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
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
      style={{
        width: 44,
        height: 24,
        borderRadius: 20,
        background: active ? '#10b981' : '#cbd5e1',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 200ms ease',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: 3,
          left: active ? 23 : 3,
          transition: 'left 200ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function LoginForm({ onLogin }: { onLogin: (token: string, email: string) => void }) {
  const [email, setEmail] = useState('admin@nsfdc.gov.in');
  const [password, setPassword] = useState('Admin@2024');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 8px 30px rgba(11,31,58,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#0b1f3a',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(11,31,58,0.15)',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: '#0b1f3a', margin: 0 }}>
                NSFDC Admin Portal
              </h1>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Governance &amp; Scheme Management
              </p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Admin Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 13.5,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 13.5,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12, padding: '10px 14px', borderRadius: 10 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                background: '#0b1f3a',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                marginTop: 4,
              }}
            >
              {loading ? 'Authenticating…' : 'Sign In as Administrator'}
            </button>
          </form>

          <div
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 11.5,
              color: '#475569',
              textAlign: 'center',
            }}
          >
            Demo credentials: <code style={{ color: '#0b1f3a', fontWeight: 700 }}>admin@nsfdc.gov.in</code> / <code style={{ color: '#0b1f3a', fontWeight: 700 }}>Admin@2024</code>
          </div>
        </div>
      </main>

      <Footer />
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
    education_loan: 'Education Loan',
    entrepreneurship: 'Entrepreneurship',
    skill_development: 'Skill Dev',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* ── Admin Top Bar ─────────────────────────────────────────────────── */}
      <header style={{ background: '#0b1f3a', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'rgba(255,255,255,0.08)',
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Portal</span>
            </Link>

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#fbbf24" />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                Admin Management Console
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: '#cbd5e1' }}>{adminEmail}</span>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Admin Body ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '32px 24px 64px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['overview', 'schemes', 'partners'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: active ? '1.5px solid #0b1f3a' : '1px solid #e2e8f0',
                  background: active ? '#0b1f3a' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  boxShadow: active ? '0 2px 6px rgba(11,31,58,0.15)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { label: 'Total Schemes', value: stats.schemes.total, sub: `${stats.schemes.active} active in catalog`, color: '#2563eb' },
                { label: 'Active Schemes', value: stats.schemes.active, sub: 'Currently matching in AI', color: '#15803d' },
                { label: 'Total Partners', value: stats.partners.total, sub: `${stats.partners.active} active branches`, color: '#7e22ce' },
                { label: 'Active Partners', value: stats.partners.active, sub: 'Eligible for routing', color: '#c2410c' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ fontSize: 36, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>
                    {s.value}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 18,
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Administrative Quick Actions
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setTab('schemes')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#0b1f3a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={15} color="#fbbf24" />
                  <span>Manage Scheme Catalog</span>
                </button>

                <button
                  onClick={() => setTab('partners')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0b1f3a',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Building2 size={15} color="#2563eb" />
                  <span>Manage Channel Partners</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schemes */}
        {tab === 'schemes' && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Loan Schemes Catalog
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                  {schemes.filter((s) => s.active).length} active of {schemes.length} total
                </p>
              </div>

              <button
                onClick={loadSchemes}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#475569',
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Loading catalog…</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                      <th style={{ padding: '14px 20px' }}>Scheme Name</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Interest</th>
                      <th style={{ padding: '14px 20px' }}>Max Loan</th>
                      <th style={{ padding: '14px 20px' }}>Income Cap</th>
                      <th style={{ padding: '14px 20px' }}>Eligibility</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                        <td style={{ padding: '14px 20px', color: '#475569' }}>{CATEGORY_LABELS[s.category] || s.category}</td>
                        <td style={{ padding: '14px 20px', color: '#15803d', fontWeight: 700 }}>{s.interest_rate_min}%</td>
                        <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 700 }}>₹{s.max_loan_lakh}L</td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>₹{s.max_income_lakh}L</td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>{s.gender_eligibility === 'women_only' ? '👩 Women Only' : 'All SC'}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
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
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Channel Partner Directory
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                  {partners.filter((p) => p.is_active).length} active of {partners.length} total
                </p>
              </div>

              <button
                onClick={loadPartners}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#475569',
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Loading partners…</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                      <th style={{ padding: '14px 20px' }}>Agency / Bank Name</th>
                      <th style={{ padding: '14px 20px' }}>Type</th>
                      <th style={{ padding: '14px 20px' }}>Location</th>
                      <th style={{ padding: '14px 20px' }}>NPA %</th>
                      <th style={{ padding: '14px 20px' }}>Fund Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                        <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 600 }}>{p.partner_type}</td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>{p.city}, {p.state}</td>
                        <td style={{ padding: '14px 20px', color: '#0f172a' }}>{p.npa_percent != null ? `${p.npa_percent}%` : '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: p.fund_availability_status === 'available' ? '#ecfdf5' : '#fff7ed', color: p.fund_availability_status === 'available' ? '#065f46' : '#9a3412' }}>
                            {p.fund_availability_status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <Toggle active={p.is_active} onToggle={() => togglePartner(p.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
