'use client';

import { CheckCircle2, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DocumentCard({
  documents,
  note,
}: {
  documents: string[];
  note?: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '24px',
        boxShadow: '0 2px 10px rgba(11,31,58,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e40af',
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>
              Required Documentation Checklist
            </h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              Prepare these official documents before visiting the partner branch
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ShieldCheck size={12} />
          <span>Official Criteria</span>
        </span>
      </div>

      {/* ── Document List Items ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {documents.map((doc, i) => (
          <div
            key={i}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#1e293b',
              transition: 'all 150ms ease',
            }}
          >
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{doc}</span>
          </div>
        ))}
      </div>

      {/* ── Note / Verification Warning ─────────────────────────────────── */}
      {note && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 12.5,
            color: '#9a3412',
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}
