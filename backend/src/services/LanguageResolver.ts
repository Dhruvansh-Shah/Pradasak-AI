import { getLanguageConfig, LanguageConfig } from '../config/languages';
import { detectLanguage } from './IntentClassifier';

export interface LanguageResolutionInput {
  selectedLanguage?: string | null;
  detectedSpeechLanguage?: string | null;
  speechProbability?: number | null;
  message?: string | null;
}

export interface LanguageResolutionResult {
  effectiveLanguage: string;
  resolutionSource: 'user_selection' | 'speech_detection' | 'text_detection' | 'fallback' | 'unsupported_selection';
  isSupported: boolean;
  languageConfig: LanguageConfig | null;
  speechProbability: number | null;
}

/**
 * Determines the authoritative effective response language for the LLM.
 *
 * Priority Order:
 * 1. Explicit user selection (authoritative if supported; controlled handling if unsupported)
 * 2. Sarvam speech detection (mapped through centralized language config)
 * 3. Native-script text detection (via detectLanguage)
 * 4. English fallback ('en')
 */
export function resolveEffectiveLanguage(input: LanguageResolutionInput): LanguageResolutionResult {
  const { selectedLanguage, detectedSpeechLanguage, speechProbability, message } = input;
  const validProb = typeof speechProbability === 'number' && !isNaN(speechProbability) ? speechProbability : null;

  // PRIORITY 1 — EXPLICIT USER SELECTION
  if (selectedLanguage && typeof selectedLanguage === 'string' && selectedLanguage.trim() !== '' && selectedLanguage.trim() !== 'auto') {
    const trimmed = selectedLanguage.trim();
    const cfg = getLanguageConfig(trimmed);
    if (cfg) {
      return {
        effectiveLanguage: cfg.id,
        resolutionSource: 'user_selection',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    } else {
      // Explicitly provided language is NOT supported
      return {
        effectiveLanguage: 'en',
        resolutionSource: 'unsupported_selection',
        isSupported: false,
        languageConfig: getLanguageConfig('en'),
        speechProbability: validProb,
      };
    }
  }

  // PRIORITY 2 — SARVAM SPEECH DETECTION
  if (detectedSpeechLanguage && typeof detectedSpeechLanguage === 'string' && detectedSpeechLanguage.trim() !== '') {
    const cfg = getLanguageConfig(detectedSpeechLanguage.trim());
    if (cfg) {
      return {
        effectiveLanguage: cfg.id,
        resolutionSource: 'speech_detection',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    }
  }

  // PRIORITY 3 — EXISTING TEXT DETECTION
  if (message && typeof message === 'string' && message.trim() !== '') {
    const detectedTextCode = detectLanguage(message);
    if (detectedTextCode && detectedTextCode !== 'unknown') {
      const hasScriptChars = /[\u0900-\u0D7Fa-zA-Z]/.test(message);
      if (hasScriptChars) {
        const cfg = getLanguageConfig(detectedTextCode);
        if (cfg) {
          return {
            effectiveLanguage: cfg.id,
            resolutionSource: 'text_detection',
            isSupported: true,
            languageConfig: cfg,
            speechProbability: validProb,
          };
        }
      }
    }
  }

  // PRIORITY 4 — ENGLISH FALLBACK
  const defaultCfg = getLanguageConfig('en');
  return {
    effectiveLanguage: 'en',
    resolutionSource: 'fallback',
    isSupported: true,
    languageConfig: defaultCfg,
    speechProbability: validProb,
  };
}
