'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
      setLangState(saved);
    }
  }, []);

  function setLang(newLang: Language) {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
    window.dispatchEvent(new Event('app_language_changed'));
  }

  function t(key: string, fallback?: string): string {
    const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (table[key]) return table[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
