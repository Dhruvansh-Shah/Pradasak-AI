'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Menu, X, Landmark, Bot, Layers, MapPin, ShieldCheck, User } from 'lucide-react';
import type { UserProfile } from '@/lib/api';

const NAV_LINKS = [
  { label: 'Explore Schemes', href: '/schemes', icon: Layers },
  { label: 'AI Assistant', href: '/chat', icon: Bot },
  { label: 'Partner Locator', href: '/partners', icon: MapPin },
  { label: 'Admin Portal', href: '/admin', icon: ShieldCheck },
];

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (u) {
      try {
        setUser(JSON.parse(u) as UserProfile);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (langOpen) {
      const close = () => setLangOpen(false);
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [langOpen]);

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    router.push('/');
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-[#0b1f3a] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3.5 group text-decoration-none py-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Pradarshak AI
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                SIH • NSFDC
              </span>
            </div>
            <span className="text-[11px] text-slate-300 tracking-wide font-normal">
              Channel Finance &amp; Concessional Loans
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/15 text-white font-semibold shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          
          {/* Language Selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentLang}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  langOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-in">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Select Language
                </div>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setCurrentLang(l.label.split(' ')[0]);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      currentLang.startsWith(l.label.split(' ')[0])
                        ? 'bg-blue-50 text-blue-800 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{l.label}</span>
                    {currentLang.startsWith(l.label.split(' ')[0]) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-white font-medium max-w-[120px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/15 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#071426] border-t border-white/10 px-4 pt-3 pb-4 space-y-1.5 animate-fade-in">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
