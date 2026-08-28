'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { userLogin, userRegister } from '@/lib/api';
import {
  Landmark,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone
} from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result: { token: string; user: { name: string | null; email: string } };
      if (mode === 'login') {
        result = await userLogin(email, password);
      } else {
        if (!phone.trim()) throw new Error('Phone number is required');
        result = await userRegister({ name: name || undefined, email, phone, password });
      }
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main className="auth-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div
          className="auth-card"
          style={{
            maxWidth: 1040,
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(11, 31, 58, 0.08)',
            border: '1.5px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          {/* ── Left Branding Showcase Column (Deep Midnight Navy) ─────────── */}
          <div
            className="auth-brand-panel"
            style={{
              background: 'linear-gradient(145deg, #0b1f3a, #071426)',
              color: '#ffffff',
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 32,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <Landmark size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff' }}>Pradarshak AI</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>National SC Finance &amp; Dev. Corp.</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fbbf24',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    padding: '3px 10px',
                    borderRadius: 20,
                    width: 'fit-content',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Beneficiary Account
                </span>

                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', lineHeight: 1.25, margin: 0 }}>
                  Access Concessional Finance with Complete Clarity
                </h1>

                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                  Sign in to save your recommended schemes, view real-time eligibility status, and keep your inquiry history across sessions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Instant scheme matching for family income ≤ ₹5L',
                  'Deterministic moratorium & repayment schedules',
                  'Direct channel partner branch routing & contacts',
                  'Full multilingual assistance in Hindi & Marathi',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#e2e8f0' }}>
                    <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
              Smart India Hackathon • Ministry of Social Justice
            </div>
          </div>

          {/* ── Right Form Column ───────────────────────────────────────────── */}
          <div
            className="auth-form-panel"
            style={{
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                {mode === 'login' ? 'Welcome Back' : 'Create Beneficiary Account'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
                {mode === 'login'
                  ? 'Sign in to access your chat history and saved schemes.'
                  : 'Register to save your conversations and track applications.'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: mode === 'login' ? 700 : 500,
                  border: 'none',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#0b1f3a' : '#64748b',
                  boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: mode === 'register' ? 700 : 500,
                  border: 'none',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#0b1f3a' : '#64748b',
                  boxShadow: mode === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Register
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'register' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
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
              )}

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
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

              {/* Mobile Phone (for Register) */}
              {mode === 'register' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
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
              )}

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 40px',
                      borderRadius: 12,
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: 13.5,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, padding: '10px 14px', borderRadius: 10 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  background: '#0b1f3a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                  marginTop: 4,
                  transition: 'all 150ms ease',
                }}
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In to Portal' : 'Create My Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <Link
                href="/"
                style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
              >
                ← Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
