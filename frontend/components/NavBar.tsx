'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Layers,
  MapPin,
  User,
  Calculator,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import type { UserProfile } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '@/lib/languages';
import EmblemOfIndia from './EmblemOfIndia';

function NavBarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, selectedMode, isAuto, setLang, t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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

  const isActive = (href: string) => {
    const isChatPage = pathname === '/chat' || pathname === '/';
    if (href === '/chat?tab=emi') {
      return isChatPage && searchParams.get('tab') === 'emi';
    }
    if (href === '/chat') {
      return isChatPage && searchParams.get('tab') !== 'emi';
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const currentLangObj = getLanguageConfig(lang) || SUPPORTED_LANGUAGES[0];

  const navLinks = [
    { label: t('nav.schemes', 'Explore Schemes'), href: '/schemes', icon: Layers },
    { label: t('nav.chat', 'Scheme Advisory'), href: '/chat', icon: MessageSquare },
    { label: t('nav.emi', 'EMI Calculator'), href: '/chat?tab=emi', icon: Calculator },
    { label: t('nav.partners', 'Partner Locator'), href: '/partners', icon: MapPin },
  ];

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Main Clean Blue Navbar (Matching Footer #00132b) ─────────── */}
      <div
        className="material-toolbar"
        style={{
          background: '#00132b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 20px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {/* ── Brand Emblem & Title ───────────────────────────────────────── */}
          <Link
            href="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: '#ffffff',
                borderRadius: 4,
                padding: '2px',
              }}
            >
              <EmblemOfIndia size={32} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 16.5,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('brand.name', 'PradarshakAI')}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  color: '#cbd5e1',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                {t('brand.subtitle', 'Ministry of Social Justice and Empowerment')}
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Tabs (Light-on-Dark Theme) ──────────────── */}
          <nav className="hidden md:flex items-center gap-1" style={{ marginLeft: 8 }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#ffffff' : '#cbd5e1',
                    background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                    }
                  }}
                >
                  <Icon size={16} color={active ? '#ffffff' : '#94a3b8'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls: Language Selector & User Auth ───────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Single Global Language Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((prev) => !prev);
                }}
                className="interactive-control focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 11px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Globe size={14} color="#ffdcc2" />
                <span>{currentLangObj.nativeName}</span>
                <ChevronDown size={13} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 190,
                    maxHeight: 360,
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '4px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', padding: '4px 8px', textTransform: 'uppercase' }}>
                    {t('nav.select_lang', 'Select Language')}
                  </div>

                  {/* Auto (Detect) Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setLang('auto');
                      setLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 4,
                      fontSize: 12.5,
                      fontWeight: isAuto ? 700 : 500,
                      color: isAuto ? '#003366' : '#334155',
                      background: isAuto ? '#f1f5f9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Auto (Detect)</span>
                    {isAuto && <span style={{ color: '#003366', fontSize: 12 }}>✓</span>}
                  </button>

                  <div style={{ height: 1, background: '#e2e8f0', margin: '2px 0' }} />

                  {SUPPORTED_LANGUAGES.map((item) => {
                    const isSelected = !isAuto && selectedMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLang(item.id);
                          setLangOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 4,
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#003366' : '#334155',
                          background: isSelected ? '#f1f5f9' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{item.nativeName}</span>
                        {isSelected && <span style={{ color: '#003366', fontSize: 12 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth Login / User Badge */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  href="/profile"
                  className="btn-bounce focus-ring"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 11px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: '#003366',
                    textDecoration: 'none',
                  }}
                >
                  <User size={14} color="#ffdcc2" />
                  <span>{user.name?.split(' ')[0] || 'Citizen'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn-bounce focus-ring"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.28)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.28)';
                  }}
                >
                  <LogOut size={13} color="#ffffff" />
                  <span>{t('nav.signout', 'Sign Out')}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Link
                  href="/auth"
                  className="btn-bounce focus-ring"
                  style={{
                    fontSize: 13,
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <User size={13} color="#ffdcc2" />
                  <span style={{ whiteSpace: 'nowrap' }}>{t('nav.signin', 'Sign In')}</span>
                </Link>
                <Link
                  href="/register"
                  className="btn-bounce focus-ring"
                  style={{
                    fontSize: 13,
                    padding: '7px 16px',
                    borderRadius: 6,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#f58220',
                    border: '1px solid transparent',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={14} />
                  <span style={{ whiteSpace: 'nowrap' }}>{t('nav.register', 'Register')}</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              className="md:hidden interactive-control focus-ring"
              onClick={() => setMobileOpen((prev) => !prev)}
              style={{
                padding: '7px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown (Dark Theme) ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden material-sheet"
          style={{
            background: '#00132b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#ffffff' : '#cbd5e1',
                  background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon size={18} color={active ? '#ffffff' : '#94a3b8'} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={16} color="#ffffff" />
                <span>{t('nav.signout', 'Sign Out')}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('nav.signin', 'Sign In')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#f58220',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('nav.register', 'Register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default function NavBar() {
  return (
    <Suspense fallback={<header style={{ minHeight: '68px', background: '#00132b', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} />}>
      <NavBarContent />
    </Suspense>
  );
}
