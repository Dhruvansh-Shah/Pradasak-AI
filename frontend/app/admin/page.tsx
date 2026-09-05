'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  ShieldCheck,
  RefreshCw,
  Lock,
  Mail,
} from 'lucide-react';

interface Scheme {
  id: number;
  name: string;
  category: string;
  interest_rate_percent: number;
  max_loan_amount: number;
  subvention_percent: number;
  is_active: boolean;
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

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Loading Admin Console…</div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

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

function AdminContent() {
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
    setAdminEmail('');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
  }

  function loadSchemes() {
    if (!token) return;
    setLoading(true);
    adminGetSchemes(token)
      .then((res: any) => setSchemes(res))
      .finally(() => setLoading(false));
  }

  function loadPartners() {
    if (!token) return;
    setLoading(true);
    adminGetPartners(token)
      .then((res: any) => setPartners(res))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) return;
    if (tab === 'schemes') loadSchemes();
    if (tab === 'partners') loadPartners();
  }, [tab, token]);

  async function toggleScheme(id: number) {
    try {
      await adminToggleScheme(token, id);
      setSchemes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function togglePartner(id: number) {
    try {
      await adminTogglePartner(token, id);
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NavBar />

      {/* Admin Sub-Nav */}
      <div style={{ background: '#0b1f3a', borderBottom: '1px solid #1e293b', color: '#fff' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={22} style={{ color: '#38bdf8' }} />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>NSFDC Governance & Monitoring Console</h1>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Logged in as: {adminEmail}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setTab('overview')}
              style={{
                background: tab === 'overview' ? '#1e293b' : 'transparent',
                color: tab === 'overview' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: tab === 'overview' ? '#38bdf8' : 'transparent',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('schemes')}
              style={{
                background: tab === 'schemes' ? '#1e293b' : 'transparent',
                color: tab === 'schemes' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: tab === 'schemes' ? '#38bdf8' : 'transparent',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Schemes & Allocations
            </button>
            <button
              onClick={() => setTab('partners')}
              style={{
                background: tab === 'partners' ? '#1e293b' : 'transparent',
                color: tab === 'partners' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: tab === 'partners' ? '#38bdf8' : 'transparent',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Channel Partners
            </button>
            <button
              onClick={logout}
              style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: 12,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px 48px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Schemes</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {stats ? `${stats.schemes.active} / ${stats.schemes.total}` : '…'}
                </div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Channel Partners</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {stats ? `${stats.partners.active} / ${stats.partners.total}` : '…'}
                </div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>National Target Achieved</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>84.2%</div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>System Health</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>Optimal</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'schemes' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Scheme Governance</h2>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                  {schemes.filter((s) => s.is_active).length} active of {schemes.length} total schemes
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
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Loading schemes…</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 20px' }}>Scheme Name</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Max Loan</th>
                      <th style={{ padding: '14px 20px' }}>Interest Rate</th>
                      <th style={{ padding: '14px 20px' }}>Subvention</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                        <td style={{ padding: '14px 20px', color: '#475569' }}>{s.category}</td>
                        <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 600 }}>
                          ₹{(s.max_loan_amount / 100000).toFixed(1)} L
                        </td>
                        <td style={{ padding: '14px 20px', color: '#059669', fontWeight: 700 }}>{s.interest_rate_percent}%</td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>
                          {s.subvention_percent > 0 ? `${s.subvention_percent}%` : 'None'}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <Toggle active={s.is_active} onToggle={() => toggleScheme(s.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'partners' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Channel Partner Directory
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                  {partners.filter((p) => p.is_active).length} active of {partners.length} total channel partners
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
                    <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
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
