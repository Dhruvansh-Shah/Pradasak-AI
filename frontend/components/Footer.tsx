import Link from 'next/link';
import { Landmark } from 'lucide-react';

const FOOTER_LINKS = ['Privacy Policy', 'Terms of Service', 'Hyperlinking Policy', 'Sitemap', 'Contact Us'];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--navy)', marginTop: 'auto' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '18px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Landmark size={14} color="rgba(255,255,255,.4)" />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: 0 }}>
            © 2024 Ministry of Social Justice and Empowerment, Government of India
          </p>
        </div>
        <nav style={{ display: 'flex', gap: 0 }}>
          {FOOTER_LINKS.map((l, i) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 10px', fontSize: 12 }}>·</span>}
              <Link
                href="#"
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,.4)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.75)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.4)'; }}
              >
                {l}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
