'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TRANSLATIONS } from '@/lib/translations';
import { getLanguageConfig, isValidLanguageCode, LanguageCode } from '@/lib/languages';

export type LanguageMode = LanguageCode | 'auto';

interface LanguageContextType {
  lang: Language;
  language: Language;
  selectedMode: LanguageMode;
  isAuto: boolean;
  setLang: (mode: LanguageMode) => void;
  updateDetectedLang: (detectedCode: string, probability?: number | null) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  language: 'en',
  selectedMode: 'auto',
  isAuto: true,
  setLang: () => {},
  updateDetectedLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [selectedMode, setSelectedMode] = useState<LanguageMode>('en');

  useEffect(() => {
    const savedMode = localStorage.getItem('app_lang_mode') as LanguageMode | null;
    const savedLang = localStorage.getItem('app_lang') as Language | null;

    if (savedMode && isValidLanguageCode(savedMode)) {
      setSelectedMode(savedMode);
      setLangState(getLanguageConfig(savedMode).id);
    } else if (savedLang && isValidLanguageCode(savedLang)) {
      setSelectedMode(savedLang);
      setLangState(getLanguageConfig(savedLang).id);
    } else {
      setSelectedMode('en');
      setLangState('en');
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
      // Ignore weak or ambiguous speech detection
      if (probability != null && probability < 0.6) return;
      if (!detectedCode || !isValidLanguageCode(detectedCode)) return;

      const cfg = getLanguageConfig(detectedCode);
      setSelectedMode(cfg.id);
      localStorage.setItem('app_lang_mode', cfg.id);
      localStorage.setItem('app_lang', cfg.id);
      setLangState((prev) => {
        if (prev !== cfg.id) {
          window.dispatchEvent(new Event('app_language_changed'));
          return cfg.id;
        }
        return prev;
      });
    },
    []
  );

  function t(key: string, fallback?: string): string {
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (table[key]) return table[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, language: lang, selectedMode, isAuto, setLang, updateDetectedLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
