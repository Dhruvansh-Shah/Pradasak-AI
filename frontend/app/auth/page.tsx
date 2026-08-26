'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userLogin, userRegister } from '@/lib/api';
import { Landmark, Eye, EyeOff } from 'lucide-react';

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
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--background)' }}
    >
      {/* Left panel */}
      <div
        className="hidden md:flex flex-col justify-between p-10 w-2/5"
        style={{ background: 'var(--accent)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base">NSFDC</div>
            <div className="text-white/70 text-xs">Channel Finance Platform</div>
          </div>
        </div>

        <div>
          <h2 className="text-white text-2xl font-bold mb-3">
            Financial Assistance<br />for SC Beneficiaries
          </h2>
          <p className="text-white/75 text-sm leading-relaxed">
            Access government loan schemes, calculate EMI, and find channel partners near you — all in one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: '📋', text: 'Personalised scheme recommendations' },
              { icon: '💰', text: 'EMI calculator for all schemes' },
              { icon: '📍', text: 'Find nearest channel partner' },
              { icon: '💬', text: 'Hindi, Marathi & English support' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-xs">
          © 2024 National Scheduled Castes Finance & Development Corporation
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>NSFDC Channel Finance</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {mode === 'login'
              ? 'Sign in to access your chat history and saved schemes.'
              : 'Sign up to save your chats and track your applications.'}
          </p>

          {/* Mode tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--muted)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                  Full Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{ background: '#fef2f2', color: '#dc2626' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
            By continuing, you agree to NSFDC&apos;s terms of service.
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
}
