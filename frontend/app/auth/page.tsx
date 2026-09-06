'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { userLogin } from '@/lib/api';
import {
  Landmark,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  ArrowRight,
  User,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Loading…</div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      router.replace('/register');
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const result = await userLogin(cleanEmail, password);
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
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff' }}>{t('brand.name', 'PradarshakAI')}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('brand.org', 'National SC Finance & Dev. Corp.')}</div>
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
                  {t('auth.title', 'Citizen Portal Sign In')}
                </h1>

                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                  {t('auth.desc', 'Access your saved loan inquiries, scheme recommendations, and partner applications.')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Instant scheme matching for family income ≤ ₹5L',
                  'Deterministic moratorium & repayment schedules',
                  'Direct channel partner branch routing & contacts',
                  'Full 11-language assistance',
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
              gap: 22,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                {t('auth.welcome_back', 'Citizen Portal Sign In')}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
                {t('auth.subtitle', 'Sign in to access your chat history and saved schemes.')}
              </p>
            </div>

            {/* Mode Switch / Action Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: 12 }}>
              <div
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center',
                  background: '#ffffff',
                  color: '#0b1f3a',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                {t('nav.signin', 'Sign In')}
              </div>
              <button
                type="button"
                onClick={() => router.push('/register')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: 'transparent',
                  color: '#fe9832',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 150ms ease',
                }}
              >
                <ShieldCheck size={14} color="#fe9832" />
                <span>Register (Verified)</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }} />
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                  {t('auth.email_label', 'Email Address')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 42px',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 14.5,
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#fbbf24'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                  {t('auth.password_label', 'Password')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 42px',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 14.5,
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#fbbf24'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  background: '#0b1f3a',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                  boxShadow: '0 4px 12px rgba(11, 31, 58, 0.15)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading ? 'Signing in…' : t('auth.login_btn', 'Sign In to Portal')}
              </button>
            </form>

            {/* Official Registration CTA Box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#059669" />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0b1f3a' }}>
                  New Beneficiary? Start Verified Registration
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Official verification with <strong>Caste Certificate OCR</strong>, <strong>Income Verification</strong>, and <strong>Live Camera Face Matching</strong> to confirm eligibility for NSFDC concessional loans.
              </p>
              <Link
                href="/register"
                className="btn btn-amber btn-bounce"
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>Proceed to Verified Registration</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ textAlign: 'center', paddingTop: 2 }}>
              <Link
                href="/"
                style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
              >
                {t('auth.back_home', '← Back to homepage')}
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
