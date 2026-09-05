'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TRANSLATIONS } from '@/lib/translations';
import { getLanguageConfig, isValidLanguageCode, LanguageCode } from '@/lib/languages';

export type LanguageMode = LanguageCode | 'auto';

interface LanguageContextType {
  lang: Language;
  selectedMode: LanguageMode;
  isAuto: boolean;
  setLang: (mode: LanguageMode) => void;
  updateDetectedLang: (detectedCode: string, probability?: number | null) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  selectedMode: 'auto',
  isAuto: true,
  setLang: () => {},
  updateDetectedLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [selectedMode, setSelectedMode] = useState<LanguageMode>('auto');

  useEffect(() => {
    const savedMode = localStorage.getItem('app_lang_mode') as LanguageMode | null;
    const savedLang = localStorage.getItem('app_lang') as Language | null;

    if (savedMode && isValidLanguageCode(savedMode)) {
      // Explicit mode explicitly saved by user (e.g. 'hi', 'kn', 'en')
      setSelectedMode(savedMode);
      setLangState(getLanguageConfig(savedMode).id);
    } else {
      // Default to Auto mode for all new users or when app_lang_mode is 'auto' / unset
      setSelectedMode('auto');
      if (savedLang && isValidLanguageCode(savedLang)) {
        setLangState(getLanguageConfig(savedLang).id);
      } else {
        setLangState('en');
      }
    }
  }, []);

  const isAuto = selectedMode === 'auto';

  const setLang = useCallback((newMode: LanguageMode) => {
    setSelectedMode(newMode);
    localStorage.setItem('app_lang_mode', newMode);

    if (newMode !== 'auto') {
      const cfg = getLanguageConfig(newMode);
      setLangState(cfg.id);
      localStorage.setItem('app_lang', cfg.id);
    }
    window.dispatchEvent(new Event('app_language_changed'));
  }, []);

  const updateDetectedLang = useCallback(
    (detectedCode: string, probability?: number | null) => {
      // Rule 1: Explicit selection MUST remain authoritative! Never override if not in Auto mode.
      if (selectedMode !== 'auto') return;

      // Rule 2: Ignore weak or ambiguous speech detection
      if (probability != null && probability < 0.6) return;

      if (!detectedCode || !isValidLanguageCode(detectedCode)) return;

      const cfg = getLanguageConfig(detectedCode);
      setLangState((prev) => {
        if (prev !== cfg.id) {
          localStorage.setItem('app_lang', cfg.id);
          window.dispatchEvent(new Event('app_language_changed'));
          return cfg.id;
        }
        return prev;
      });
    },
    [selectedMode]
  );

  function t(key: string, fallback?: string): string {
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (table[key]) return table[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, selectedMode, isAuto, setLang, updateDetectedLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
