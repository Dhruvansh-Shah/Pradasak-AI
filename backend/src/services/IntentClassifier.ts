export type Language = 'en' | 'hi' | 'mr' | 'unknown';

/**
 * Lightweight heuristic language detector.
 *
 * NOTE: Intent classification used to live in this file as a large
 * keyword/synonym lookup table. That has been removed — intent is now
 * decided by a single grounded LLM call in `Understanding.ts`, which
 * reads the full conversation instead of matching keywords.
 *
 * This detector is kept only as a fast, dependency-free fallback:
 * it's used to pick a sensible reply language for the very first
 * message before the understanding call resolves, and as a safety net
 * if the LLM call ever fails.
 */
export function detectLanguage(text: string): Language {
  const devanagariChars = (text.match(/[ऀ-ॿ]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  if (totalChars === 0 || devanagariChars / totalChars < 0.1) return 'en';

  // Grammatical markers for distinguishing Hindi and Marathi
  const hindiMarkers = ['मुझे', 'चाहिए', 'है', 'हैं', 'करना', 'रहा', 'रही', 'था', 'थी', 'के लिए', 'सकता', 'सकती', 'नमस्ते', 'धन्यवाद', 'में', 'का', 'की', 'के'];
  const marathiMarkers = ['मला', 'हवे', 'आहे', 'आहेत', 'करायचे', 'व्हायचे', 'आहे का', 'नाही', 'पाहिजे', 'नमस्कार', 'मध्ये', 'चे', 'च्या', 'सुरू'];

  const hindiScore = hindiMarkers.filter((w) => text.includes(w)).length;
  const marathiScore = marathiMarkers.filter((w) => text.includes(w)).length;

  if (marathiScore > hindiScore) return 'mr';
  return 'hi';
}
