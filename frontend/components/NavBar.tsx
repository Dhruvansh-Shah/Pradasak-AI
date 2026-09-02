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
  Calculator,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/lib/translations';
import EmblemOfIndia from './EmblemOfIndia';

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'hi', label: 'हिंदी', name: 'हिंदी' },
  { code: 'mr', label: 'मराठी', name: 'मराठी' },
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
    { label: t('nav.schemes', 'Schemes Catalog'), href: '/schemes', icon: Layers },
    { label: t('nav.chat', 'AI Assistant'), href: '/chat', icon: Bot },
    { label: t('nav.emi', 'EMI Calculator'), href: '/chat?tab=emi', icon: Calculator },
    { label: t('nav.partners', 'Partner Locator'), href: '/partners', icon: MapPin },
  ];

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Official Government Institutional Top Strip ───────────────────── */}
      <div
        style={{
          background: '#00132b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#cbd5e1',
          fontSize: '11.5px',
          padding: '5px 0',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              भारत सरकार | Government of India
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span className="hidden md:inline" style={{ color: '#94a3b8' }}>
              Ministry of Social Justice & Empowerment (MoSJE)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="hidden sm:flex items-center gap-1.5" style={{ color: '#fed7aa' }}>
              <PhoneCall size={12} color="#fe9832" />
              <span style={{ fontSize: 11 }}>Toll-Free Helpline: <strong>1800-11-2001</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={13} color="#8dfc75" />
              <span style={{ fontSize: 11, color: '#e6eef8' }}>NSFDC Verified Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Government Blue Navbar ──────────────────────────────────── */}
      <div
        style={{
          background: '#001e40',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ── Brand Emblem & Title ───────────────────────────────────────── */}
          <Link
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
                width: 44,
                height: 48,
                borderRadius: 4,
                background: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              <EmblemOfIndia size={38} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {t('brand.name', 'Pradarshak AI')}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: '#cbd5e1',
                  fontWeight: 500,
                }}
              >
                National SC Financial Assistance Portal
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Tabs (Clean Institutional) ──────────────── */}
          <nav className="hidden md:flex items-center gap-1">
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
                    borderRadius: 4,
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#ffffff' : '#cbd5e1',
                    background: active ? '#003366' : 'transparent',
                    border: active ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 120ms ease',
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
                  <Icon size={15} color={active ? '#ffdcc2' : '#94a3b8'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls: Language Selector & User Auth ───────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((prev) => !prev);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 11px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#f8fafc',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                }}
              >
                <Globe size={14} color="#ffdcc2" />
                <span>{currentLangObj.name}</span>
                <ChevronDown size={13} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 160,
                    background: '#001e40',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 4,
                    padding: '4px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', padding: '4px 8px', textTransform: 'uppercase' }}>
                    Language
                  </div>
                  {LANGS.map((item) => {
                    const isSelected = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setLangOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 8px',
                          borderRadius: 3,
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          background: isSelected ? '#003366' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{item.label}</span>
                        {isSelected && <span style={{ color: '#ffdcc2', fontSize: 12 }}>✓</span>}
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
                  className="btn-bounce"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 11px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: '#003366',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textDecoration: 'none',
                  }}
                >
                  <User size={14} color="#ffdcc2" />
                  <span>{user.name?.split(' ')[0] || 'Citizen'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn-bounce"
                  style={{
                    padding: '7px 9px',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="btn btn-amber btn-bounce"
                style={{
                  fontSize: 13.5,
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                <User size={14} />
                <span>{t('nav.login', 'Citizen Login')}</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              style={{
                padding: '7px',
                borderRadius: 4,
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

      {/* ── Mobile Menu Dropdown ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: '#001e40',
            borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
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
                  borderRadius: 4,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#ffffff' : '#cbd5e1',
                  background: active ? '#003366' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} color={active ? '#ffdcc2' : '#94a3b8'} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
