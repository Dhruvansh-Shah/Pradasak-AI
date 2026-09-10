import React from 'react';

export default function GuestBanner() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
      color: '#fff',
      padding: '0.75rem 1rem',
      textAlign: 'center',
      marginBottom: '1rem',
      borderRadius: '0.5rem',
      backdropFilter: 'blur(8px)'
    }}>
      <span>You are browsing as a <strong>Guest</strong>. </span>
      <a href="/auth" style={{ color: '#4ade80', marginLeft: '0.5rem' }}>(Log in / Register)</a>
    </div>
  );
}
