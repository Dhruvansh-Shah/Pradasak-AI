'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  userLogin,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
} from '@/lib/api';
import {
  Landmark,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Lock,
  ShieldCheck,
  RefreshCw,
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

type AuthMode = 'SIGN_IN' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'FORGOT_NEW_PW';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // Mode state
  const [authMode, setAuthMode] = useState<AuthMode>('SIGN_IN');

  // Sign In states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Forgot Password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Shared UI states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      const returnUrl = searchParams.get('returnUrl');
      router.replace(returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register');
    }
  }, [searchParams, router]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Sign In submission
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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
      const returnUrl = searchParams.get('returnUrl') || '/';
      router.push(returnUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // 2. Forgot Password - Send OTP
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordSendOtp(cleanEmail);
      setResendCooldown(30);
      setForgotOtp('');
      setAuthMode('FORGOT_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Forgot Password - Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordVerifyOtp(forgotEmail.trim(), cleanOtp);
      setResetToken(res.resetToken);
      setAuthMode('FORGOT_NEW_PW');
    } catch (err: any) {
      setError(err.message || 'The OTP you entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 4. Forgot Password - Reset Password & Auto Login
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(resetToken, newPassword, confirmPassword);
      setSuccessMsg(res.message || 'Password reset successfully. You are now signed in.');
      
      // Auto login: store authenticated session
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));

      // Redirect smoothly to the main application
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  }

  function switchToSignIn() {
    setError('');
    setSuccessMsg('');
    setAuthMode('SIGN_IN');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div
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
                  {authMode === 'SIGN_IN' ? 'Beneficiary Account' : 'Account Recovery'}
                </span>

                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', lineHeight: 1.25, margin: 0 }}>
                  {authMode === 'SIGN_IN'
                    ? t('auth.title', 'Citizen Portal Sign In')
                    : 'Secure Password Reset'}
                </h1>

                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                  {authMode === 'SIGN_IN'
                    ? t('auth.desc', 'Access your saved loan inquiries, scheme recommendations, and partner applications.')
                    : 'Verify your registered email with a one-time password to safely reset your credentials.'}
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
            style={{
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {/* Global Error Banner */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  color: '#b91c1c',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Global Success Banner */}
            {successMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 12,
                  color: '#047857',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{successMsg}</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STATE 1: SIGN IN
               ══════════════════════════════════════════════════════════════════ */}
            {authMode === 'SIGN_IN' && (
              <>
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

                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Email */}
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
                        onChange={(e) => setEmail(e.target.value)}
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
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#fbbf24')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
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
                        onChange={(e) => setPassword(e.target.value)}
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
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#fbbf24')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
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
                          padding: 4,
                        }}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Small Blue "Forgot Password?" Link */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setError('');
                        setForgotEmail(email.trim());
                        setAuthMode('FORGOT_EMAIL');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2563eb',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Sign In Button */}
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
                      transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STATE 2: FORGOT PASSWORD — EMAIL SCREEN
               ══════════════════════════════════════════════════════════════════ */}
            {authMode === 'FORGOT_EMAIL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                    Forgot Password?
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    Enter your registered email address and we'll send you a verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      Registered Email Address
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
                        style={{
                          width: '100%',
                          padding: '12px 16px 12px 42px',
                          borderRadius: 12,
                          border: '1.5px solid #e2e8f0',
                          fontSize: 14.5,
                          color: '#0f172a',
                          background: '#f8fafc',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="get-otp-btn"
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
                      boxShadow: '0 4px 12px rgba(11, 31, 58, 0.15)',
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Sending verification code…</span>
                      </>
                    ) : (
                      <>
                        <span>Get OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={switchToSignIn}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0b1f3a')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STATE 3: OTP VERIFICATION SCREEN
               ══════════════════════════════════════════════════════════════════ */}
            {authMode === 'FORGOT_OTP' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                    Verify Your Email
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    We've sent a 6-digit verification code to{' '}
                    <strong style={{ color: '#0b1f3a' }}>{forgotEmail}</strong>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      Enter 6-Digit OTP
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type="text"
                        required
                        autoFocus
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        style={{
                          width: '100%',
                          padding: '12px 16px 12px 42px',
                          borderRadius: 12,
                          border: '1.5px solid #e2e8f0',
                          fontSize: 20,
                          fontWeight: 700,
                          letterSpacing: 8,
                          color: '#0f172a',
                          background: '#f8fafc',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotOtp.length !== 6}
                    id="verify-otp-btn"
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      background: '#0b1f3a',
                      color: '#ffffff',
                      fontSize: 14.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: loading || forgotOtp.length !== 6 ? 'not-allowed' : 'pointer',
                      opacity: loading || forgotOtp.length !== 6 ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(11, 31, 58, 0.15)',
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verifying OTP…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify OTP</span>
                      </>
                    )}
                  </button>

                  {/* Resend OTP info & cooldown */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                    <span>Didn't receive the code?</span>
                    {resendCooldown > 0 ? (
                      <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#2563eb',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setAuthMode('FORGOT_EMAIL');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0b1f3a')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STATE 4: CREATE NEW PASSWORD
               ══════════════════════════════════════════════════════════════════ */}
            {authMode === 'FORGOT_NEW_PW' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                    Create New Password
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    Enter your new secure password below to complete account recovery.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* New Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{
                          width: '100%',
                          padding: '12px 42px',
                          borderRadius: 12,
                          border: '1.5px solid #e2e8f0',
                          fontSize: 14.5,
                          color: '#0f172a',
                          background: '#f8fafc',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        style={{
                          width: '100%',
                          padding: '12px 42px',
                          borderRadius: 12,
                          border: '1.5px solid #e2e8f0',
                          fontSize: 14.5,
                          color: '#0f172a',
                          background: '#f8fafc',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="reset-password-btn"
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
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Reset Password & Sign In</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={switchToSignIn}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0b1f3a')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Back to Homepage */}
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
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
