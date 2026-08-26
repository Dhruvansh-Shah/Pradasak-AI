'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userLogin, userRegister } from '@/lib/api';
import { Landmark, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      
      {/* Left Branding Showcase Column */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 w-5/12 bg-gradient-to-br from-[#0b1f3a] via-[#102a4c] to-[#071426] text-white relative overflow-hidden">
        <div className="space-y-6 relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Landmark className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight text-white">Pradarshak AI</div>
              <div className="text-xs text-slate-300">National SC Finance &amp; Dev. Corp.</div>
            </div>
          </Link>

          <div className="pt-10 space-y-4 max-w-md">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
              Beneficiary Portal
            </span>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Access Concessional Finance with Clarity
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sign in to save your recommended schemes, view real-time eligibility status, and keep your inquiry history across sessions.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            {[
              'Instant scheme matching for family income ≤ ₹5L',
              'Deterministic moratorium & repayment schedules',
              'Direct channel partner branch routing & contacts',
              'Full multilingual assistance in Hindi & Marathi',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 relative z-10 pt-8 border-t border-white/10">
          Developed for Smart India Hackathon • Ministry of Social Justice
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-lg">
          
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-[#0b1f3a] tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create beneficiary account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === 'login'
                ? 'Sign in to access your chat history and saved schemes.'
                : 'Register to save your conversations and track applications.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-[#0b1f3a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#0b1f3a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0b1f3a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In to Portal' : 'Create My Account'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-[#0b1f3a] font-semibold"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
