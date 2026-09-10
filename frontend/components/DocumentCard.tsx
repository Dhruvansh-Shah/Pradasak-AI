'use client';

import { CheckCircle2, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSchemeName, getLocalizedDocumentItem, getLocalizedWarning } from '@/lib/translations';

export interface DocumentCardProps {
  documents: string[];
  note?: string;
  schemeName?: string;
  speechText?: string;
  onPlayVoice?: () => void;
  onStopVoice?: () => void;
  isVoicePlaying?: boolean;
  isVoiceLoading?: boolean;
}

export default function DocumentCard({
  documents,
  note,
  schemeName,
  speechText,
  onPlayVoice,
  onStopVoice,
  isVoicePlaying,
  isVoiceLoading,
}: DocumentCardProps) {
  const { language, t } = useLanguage();
  const localizedScheme = schemeName ? getLocalizedSchemeName(schemeName, language) : '';

  return (
    <div
      style={{
        background: 'var(--surface, #ffffff)',
        border: '1.5px solid var(--border, #e2e8f0)',
        borderRadius: 18,
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
        color: 'var(--text)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border, #f1f5f9)',
          paddingBottom: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--surface-container, #eff6ff)',
              border: '1px solid var(--border, #bfdbfe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #1e40af)',
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text, #0b1f3a)', margin: 0 }}>
              {schemeName ? `${t('docs.title_prefix')} ${localizedScheme}` : t('docs.checklist_title')}
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #64748b)' }}>
              {t('docs.subtitle')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onPlayVoice && (
            <VoiceButton
              isPlaying={!!isVoicePlaying}
              isLoading={!!isVoiceLoading}
              onPlay={onPlayVoice}
              onStop={onStopVoice || (() => {})}
              title={t('docs.listen_title')}
            />
          )}

          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(5, 150, 105, 0.12)',
              color: '#059669',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={12} />
            <span>{t('docs.official_criteria')}</span>
          </span>
        </div>
      </div>

      {/* ── Document List Items ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {documents.map((doc, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-container, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--text, #1e293b)',
              transition: 'all 150ms ease',
            }}
          >
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{getLocalizedDocumentItem(doc, language)}</span>
          </div>
        ))}
      </div>

      {/* ── Note / Verification Warning ─────────────────────────────────── */}
      {note && (
        <div
          style={{
            background: 'rgba(234, 88, 12, 0.08)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12.5,
            color: 'var(--text, #9a3412)',
          }}
        >
          <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
          <span>{getLocalizedWarning(note, language)}</span>
        </div>
      )}
    </div>
  );
}
