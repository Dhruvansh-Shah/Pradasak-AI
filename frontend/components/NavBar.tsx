'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Menu, X, Landmark } from 'lucide-react';
import type { UserProfile } from '@/lib/api';

const NAV_LINKS = [
  { label: 'Schemes', href: '/schemes' },
  { label: 'Eligibility', href: '/chat' },
  { label: 'Application Status', href: '/chat' },
  { label: 'Guidelines', href: '/schemes' },
  { label: 'Grievance', href: '/chat' },
  { label: 'Resources', href: '/schemes' },
];

const LANGS = ['English', 'हिंदी', 'मराठी'];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('English');

  useEffect(() => {
    const u = localStorage.getItem('auth_user');
    if (u) { try { setUser(JSON.parse(u) as UserProfile); } catch {} }
  }, []);

  useEffect(() => {
    if (langOpen) {
      const close = () => setLangOpen(false);
      document.addEventListener('click', close, { once: true });
    }
  }, [langOpen]);

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    router.push('/');
  }

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header
      style={{
        background: 'var(--navy)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 0 rgba(255,255,255,.08)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 32, padding: '13px 0', flexShrink: 0 }}
        >
          <div style={{
            width: 34, height: 34,
            background: 'rgba(255,255,255,.12)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,.15)',
          }}>
            <Landmark size={16} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.1, letterSpacing: '-.01em' }}>
              Financial Assistance Portal
            </div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10.5, letterSpacing: '.01em' }}>
              Ministry of Social Justice
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 0, flex: 1 }} className="hidden md:flex">
          {NAV_LINKS.map(link => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,.65)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  padding: '17px 13px',
                  borderBottom: `2px solid ${active ? 'white' : 'transparent'}`,
                  whiteSpace: 'nowrap',
                  transition: 'color 180ms ease, border-color 180ms ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'white';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.65)';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Language selector */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLangOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: 500,
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                transition: 'background 180ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.14)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.08)'; }}
            >
              <Globe size={13} />
              {lang}
              <ChevronDown size={11} style={{ transition: 'transform 180ms ease', transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {langOpen && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: 'var(--shadow)', minWidth: 130,
                  overflow: 'hidden', zIndex: 200,
                }}
              >
                {LANGS.map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: 13, border: 'none',
                      background: lang === l ? 'var(--surface)' : 'white',
                      color: lang === l ? 'var(--navy)' : 'var(--text)',
                      fontWeight: lang === l ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={e => { if (lang !== l) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={e => { if (lang !== l) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>
                {user.name || user.email.split('@')[0]}
              </span>
              <button
                onClick={logout}
                style={{
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                  color: 'white', fontSize: 12, fontWeight: 600,
                  padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                  transition: 'background 180ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.1)'; }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              style={{
                background: 'white', color: 'var(--navy)',
                fontSize: 13, fontWeight: 700,
                padding: '7px 18px', borderRadius: 6,
                textDecoration: 'none',
                transition: 'background 180ms ease, transform 180ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              Login
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'rgba(255,255,255,.1)', border: 'none', color: 'white',
              cursor: 'pointer', padding: 7, borderRadius: 6, display: 'flex',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="animate-fade-in md:hidden"
          style={{ background: 'var(--navy-hover)', borderTop: '1px solid rgba(255,255,255,.08)' }}
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '13px 24px',
                color: 'rgba(255,255,255,.8)', textDecoration: 'none',
                fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
