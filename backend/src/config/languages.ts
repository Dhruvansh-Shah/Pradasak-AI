export interface LanguageConfig {
  id: string;
  name: string;
  nativeName: string;
  sarvamSttCode: string;
  sarvamTtsCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { id: 'en', name: 'English', nativeName: 'English', sarvamSttCode: 'en-IN', sarvamTtsCode: 'en-IN' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी', sarvamSttCode: 'hi-IN', sarvamTtsCode: 'hi-IN' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', sarvamSttCode: 'mr-IN', sarvamTtsCode: 'mr-IN' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', sarvamSttCode: 'bn-IN', sarvamTtsCode: 'bn-IN' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sarvamSttCode: 'gu-IN', sarvamTtsCode: 'gu-IN' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sarvamSttCode: 'kn-IN', sarvamTtsCode: 'kn-IN' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sarvamSttCode: 'ml-IN', sarvamTtsCode: 'ml-IN' },
  { id: 'od', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', sarvamSttCode: 'od-IN', sarvamTtsCode: 'od-IN' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sarvamSttCode: 'pa-IN', sarvamTtsCode: 'pa-IN' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sarvamSttCode: 'ta-IN', sarvamTtsCode: 'ta-IN' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', sarvamSttCode: 'te-IN', sarvamTtsCode: 'te-IN' },
];

export const LANGUAGE_MAP: Record<string, LanguageConfig> = SUPPORTED_LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.id] = lang;
    return acc;
  },
  {} as Record<string, LanguageConfig>
);

export function getLanguageConfig(code?: string): LanguageConfig | null {
  if (!code) return null;
  const normalized = code.toLowerCase();
  if (LANGUAGE_MAP[normalized]) {
    return LANGUAGE_MAP[normalized];
  }
  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.sarvamSttCode.toLowerCase() === normalized || l.sarvamTtsCode.toLowerCase() === normalized
  );
  return found || null;
}
