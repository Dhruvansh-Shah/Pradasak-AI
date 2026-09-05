export interface LanguageConfig {
  id: LanguageCode;
  name: string;
  nativeName: string;
  sarvamSttCode: string;
  sarvamTtsCode: string;
}

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'od'
  | 'pa'
  | 'ta'
  | 'te';

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

export function getLanguageConfig(code?: string): LanguageConfig {
  if (!code) return LANGUAGE_MAP.en;
  const normalized = code.toLowerCase();
  return (
    LANGUAGE_MAP[normalized] ||
    SUPPORTED_LANGUAGES.find(
      (l) => l.sarvamSttCode.toLowerCase() === normalized || l.sarvamTtsCode.toLowerCase() === normalized
    ) ||
    LANGUAGE_MAP.en
  );
}

export function isValidLanguageCode(code?: string): code is LanguageCode {
  if (!code) return false;
  const normalized = code.toLowerCase();
  return SUPPORTED_LANGUAGES.some(
    (l) => l.id === normalized || l.sarvamSttCode.toLowerCase() === normalized || l.sarvamTtsCode.toLowerCase() === normalized
  );
}
