'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  Landmark,
  Bot,
  Layers,
  MapPin,
  User,
} from 'lucide-react';
import type { UserProfile } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/lib/translations';

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)', name: 'हिंदी' },
  { code: 'mr', label: 'मराठी (Marathi)', name: 'मराठी' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
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

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const currentLangObj = LANGS.find((l) => l.code === lang) || LANGS[0];

  const navLinks = [
    { label: t('nav.schemes', 'Explore Schemes'), href: '/schemes', icon: Layers },
    { label: t('nav.chat', 'AI Assistant'),       href: '/chat',    icon: Bot },
    { label: t('nav.partners', 'Partner Locator'), href: '/partners', icon: MapPin },
  ];

  return (
    <header
      style={{
        background: '#0b1f3a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        width: '100%',
      }}
    >
      <div
        className="nav-inner"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ── Brand Logo (Left) ────────────────────────────────────────────── */}
        <Link
          className="nav-brand"
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Landmark size={20} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {t('brand.name', 'Pradarshak AI')}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  color: '#fbbf24',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                SIH • NSFDC
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.01em' }}>
              {t('brand.subtitle', 'Channel Finance & Concessional Loans')}
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links (Center) ────────────────────────────── */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {navLinks.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  textDecoration: 'none',
                  color: active ? '#ffffff' : '#cbd5e1',
                  background: active ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                  border: active ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                  transition: 'all 150ms ease',
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
                <Icon size={16} color={active ? '#fbbf24' : '#94a3b8'} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Right Controls: Language & Sign In ───────────────────────────── */}
        <div className="desktop-nav-controls" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Language Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Globe size={15} color="#fbbf24" />
              <span>{currentLangObj.name}</span>
              <ChevronDown size={13} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>

            {langOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: 8,
                  width: 170,
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: 14,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  border: '1px solid #e2e8f0',
                  padding: '6px',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                  {t('nav.select_lang', 'Select Language')}
                </div>
                {LANGS.map((l) => {
                  const isCurrent = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        fontSize: 13,
                        fontWeight: isCurrent ? 700 : 500,
                        borderRadius: 8,
                        border: 'none',
                        background: isCurrent ? '#eef3f9' : 'transparent',
                        color: isCurrent ? '#0b1f3a' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{l.label}</span>
                      {isCurrent && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0b1f3a' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile or Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                <User size={14} color="#fbbf24" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email.split('@')[0]}
                </span>
              </div>

              <button
                onClick={logout}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f87171',
                  padding: '7px 12px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Sign out"
              >
                {t('nav.signout', 'Sign Out')}
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 20px',
                borderRadius: 10,
                background: '#e87722',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(232, 119, 34, 0.35)',
                transition: 'all 150ms ease',
              }}
            >
              {t('nav.signin', 'Sign In')}
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            className="nav-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              padding: 8,
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-nav-panel">
          <nav className="mobile-nav-links" aria-label="Mobile navigation">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                    color: active ? '#ffffff' : '#e2e8f0', background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                    textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 600,
                  }}
                >
                  <Icon size={17} color={active ? '#fbbf24' : '#94a3b8'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mobile-language-options">
            {LANGS.map((language) => (
              <button
                key={language.code}
                onClick={() => { setLang(language.code); setMobileOpen(false); }}
                className={language.code === lang ? 'mobile-language-active' : ''}
              >
                <Globe size={15} /> {language.label}
              </button>
            ))}
          </div>

          {user ? (
            <button className="mobile-signout" onClick={() => { logout(); setMobileOpen(false); }}>
              {t('nav.signout', 'Sign Out')}
            </button>
          ) : (
            <Link className="mobile-signin" href="/auth" onClick={() => setMobileOpen(false)}>
              {t('nav.signin', 'Sign In')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
