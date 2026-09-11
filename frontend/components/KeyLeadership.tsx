'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Leader {
  name: string;
  role: string;
  image: string;
  facebook: string;
  twitter: string;
  profile: string;
}

const LEADERS: Leader[] = [
  {
    name: 'Dr. Virendra Kumar',
    role: 'Union Minister of Social Justice and Empowerment',
    image: '/images/leadership/virendra-kumar.png',
    facebook: 'https://www.facebook.com/DrVirendraKumarMP/',
    twitter: 'https://x.com/drvirendrakum1',
    profile: 'https://dosje.gov.in/about-ministry/whos-who',
  },
  {
    name: 'Shri Ramdas Athawale',
    role: 'Minister of State of Social Justice & Empowerment',
    image: '/images/leadership/ramdas-athawale.png',
    facebook: 'https://www.facebook.com/RamdasAthawaleOfficial/',
    twitter: 'https://x.com/RamdasAthawale',
    profile: 'https://dosje.gov.in/about-ministry/whos-who',
  },
  {
    name: 'Shri B. L. Verma',
    role: 'Minister of State of Social Justice & Empowerment',
    image: '/images/leadership/bl-verma.png',
    facebook: 'https://www.facebook.com/blvermabjp/',
    twitter: 'https://x.com/blvermaup',
    profile: 'https://dosje.gov.in/about-ministry/whos-who',
  },
];

export default function KeyLeadership() {
  const { t } = useLanguage();

  return (
    <section style={{ backgroundColor: '#071326', padding: '80px 24px', width: '100%', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* BADGE */}
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '9999px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {t('leadership.badge', 'MINISTRY OF SOCIAL JUSTICE & EMPOWERMENT')}
        </div>

        {/* HEADING */}
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginBottom: '12px', lineHeight: 1.2 }}>
          {t('leadership.title', 'Key Leadership')}
        </h2>

        {/* SUBTITLE */}
        <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto 80px auto', lineHeight: 1.6 }}>
          {t('leadership.subtitle', 'Distinguished leadership steering national affirmative action, concessional financial assistance, and socioeconomic empowerment.')}
        </p>

        {/* CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px 24px' }}>
          
          {/* CARD 1 */}
          <div style={{ maxWidth: '320px', margin: '0 auto', position: 'relative', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.8)', borderRadius: '16px', paddingTop: '56px', paddingBottom: '18px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img 
              src="/images/leadership/virendra-kumar.png" 
              alt={t('leadership.virendra_kumar', 'Dr. Virendra Kumar')} 
              style={{ position: 'absolute', top: '-48px', left: '50%', transform: 'translateX(-50%)', width: '96px', height: '96px', borderRadius: '9999px', border: '4px solid #071326', objectFit: 'cover' }} 
            />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', textAlign: 'center' }}>
              {t('leadership.virendra_kumar', 'Dr. Virendra Kumar')}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 12px 0', minHeight: '40px', textAlign: 'center' }}>
              {t('leadership.role_union', t('leadership.union_minister', 'Union Minister of Social Justice and Empowerment'))}
            </p>
            <div style={{ marginTop: 'auto', width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(51, 65, 85, 0.6)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <a href="https://www.facebook.com/drvirendrakum13/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Facebook">f</a>
              <a href="https://x.com/Drvirendrakum13?lang=en" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="X (Twitter)">𝕏</a>
              <a href="https://sansad.in/ls/members/biographyM/515?from=members" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Profile">👤</a>
            </div>
          </div>

          {/* CARD 2 */}
          <div style={{ maxWidth: '320px', margin: '0 auto', position: 'relative', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.8)', borderRadius: '16px', paddingTop: '56px', paddingBottom: '18px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img 
              src="/images/leadership/ramdas-athawale.png" 
              alt={t('leadership.ramdas_athawale', 'Shri Ramdas Athawale')} 
              style={{ position: 'absolute', top: '-48px', left: '50%', transform: 'translateX(-50%)', width: '96px', height: '96px', borderRadius: '9999px', border: '4px solid #071326', objectFit: 'cover' }} 
            />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', textAlign: 'center' }}>
              {t('leadership.ramdas_athawale', 'Shri Ramdas Athawale')}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 12px 0', minHeight: '40px', textAlign: 'center' }}>
              {t('leadership.role_state', t('leadership.mos', 'Minister of State of Social Justice & Empowerment'))}
            </p>
            <div style={{ marginTop: 'auto', width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(51, 65, 85, 0.6)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <a href="https://www.facebook.com/ramdasathawale" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Facebook">f</a>
              <a href="https://x.com/RamdasAthawale?lang=en" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="X (Twitter)">𝕏</a>
              <a href="https://sansad.in/rs/members/biographyM/2248" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Profile">👤</a>
            </div>
          </div>

          {/* CARD 3 */}
          <div style={{ maxWidth: '320px', margin: '0 auto', position: 'relative', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.8)', borderRadius: '16px', paddingTop: '56px', paddingBottom: '18px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img 
              src="/images/leadership/bl-verma.png" 
              alt={t('leadership.bl_verma', 'Shri B. L. Verma')} 
              style={{ position: 'absolute', top: '-48px', left: '50%', transform: 'translateX(-50%)', width: '96px', height: '96px', borderRadius: '9999px', border: '4px solid #071326', objectFit: 'cover' }} 
            />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', textAlign: 'center' }}>
              {t('leadership.bl_verma', 'Shri B. L. Verma')}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 12px 0', minHeight: '40px', textAlign: 'center' }}>
              {t('leadership.role_state', t('leadership.mos', 'Minister of State of Social Justice & Empowerment'))}
            </p>
            <div style={{ marginTop: 'auto', width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(51, 65, 85, 0.6)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <a href="https://www.facebook.com/blvermaofficial" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Facebook">f</a>
              <a href="https://x.com/blvermaup?lang=en" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="X (Twitter)">𝕏</a>
              <a href="https://sansad.in/rs/members/biographyM/2491" target="_blank" rel="noopener noreferrer" className="w-11 h-11 text-base rounded-full border border-slate-600 bg-slate-800/60 hover:bg-slate-700 hover:border-amber-400 hover:text-white transition-all flex items-center justify-center text-[#cbd5e1]" aria-label="Profile">👤</a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
