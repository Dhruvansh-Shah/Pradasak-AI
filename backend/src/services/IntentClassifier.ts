export type Language =
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
  | 'te'
  | 'unknown';

/**
 * Lightweight heuristic text-language detector supporting all 11 official languages.
 * Uses pure JS Unicode script range detection.
 *
 * Supported script ranges:
 * - Devanagari: Hindi ('hi') / Marathi ('mr')
 * - Bengali: Bengali ('bn')
 * - Gurmukhi: Punjabi ('pa')
 * - Gujarati: Gujarati ('gu')
 * - Odia: Odia ('od')
 * - Tamil: Tamil ('ta')
 * - Telugu: Telugu ('te')
 * - Kannada: Kannada ('kn')
 * - Malayalam: Malayalam ('ml')
 * - Latin: English ('en')
 */
export function detectLanguage(text: string): Language {
  if (!text || typeof text !== 'string') return 'en';

  const cleanText = text.trim();
  if (!cleanText) return 'en';

  // Character counts per script range
  const scriptCounts: Record<string, number> = {
    devanagari: (cleanText.match(/[\u0900-\u097F]/g) || []).length,
    bengali: (cleanText.match(/[\u0980-\u09FF]/g) || []).length,
    gurmukhi: (cleanText.match(/[\u0A00-\u0A7F]/g) || []).length,
    gujarati: (cleanText.match(/[\u0A80-\u0AFF]/g) || []).length,
    odia: (cleanText.match(/[\u0B00-\u0B7F]/g) || []).length,
    tamil: (cleanText.match(/[\u0B80-\u0BFF]/g) || []).length,
    telugu: (cleanText.match(/[\u0C00-\u0C7F]/g) || []).length,
    kannada: (cleanText.match(/[\u0C80-\u0CFF]/g) || []).length,
    malayalam: (cleanText.match(/[\u0D00-\u0D7F]/g) || []).length,
    latin: (cleanText.match(/[a-zA-Z]/g) || []).length,
  };

  // Find dominant Indian script if present
  let maxIndianScript = '';
  let maxIndianCount = 0;

  for (const [script, count] of Object.entries(scriptCounts)) {
    if (script !== 'latin' && count > maxIndianCount) {
      maxIndianCount = count;
      maxIndianScript = script;
    }
  }

  // If native Indian script is present, identify language
  if (maxIndianCount > 0) {
    switch (maxIndianScript) {
      case 'bengali':
        return 'bn';
      case 'gurmukhi':
        return 'pa';
      case 'gujarati':
        return 'gu';
      case 'odia':
        return 'od';
      case 'tamil':
        return 'ta';
      case 'telugu':
        return 'te';
      case 'kannada':
        return 'kn';
      case 'malayalam':
        return 'ml';
      case 'devanagari': {
        // Distinguish Hindi and Marathi using grammatical markers
        const hindiMarkers = ['मुझे', 'चाहिए', 'है', 'हैं', 'करना', 'रहा', 'रही', 'था', 'थी', 'के लिए', 'सकता', 'सकती', 'नमस्ते', 'धन्यवाद', 'में', 'का', 'की', 'के'];
        const marathiMarkers = ['मला', 'हवे', 'आहे', 'आहेत', 'करायचे', 'व्हायचे', 'आहे का', 'नाही', 'पाहिजे', 'नमस्कार', 'मध्ये', 'चे', 'च्या', 'सुरू'];

        const hindiScore = hindiMarkers.filter((w) => cleanText.includes(w)).length;
        const marathiScore = marathiMarkers.filter((w) => cleanText.includes(w)).length;

        if (marathiScore > hindiScore) return 'mr';
        return 'hi';
      }
    }
  }

  // 2. Romanized Indian Language Detection for Latin script
  const lowerText = cleanText.toLowerCase();
  const tokens = lowerText.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'en';

  const romanizedScores: Record<Exclude<Language, 'en' | 'unknown'>, number> = {
    hi: detectRomanizedHindi(tokens),
    mr: detectRomanizedMarathi(tokens),
    kn: detectRomanizedKannada(tokens),
    ta: detectRomanizedTamil(tokens),
    te: detectRomanizedTelugu(tokens),
    bn: detectRomanizedBengali(tokens),
    gu: detectRomanizedGujarati(tokens),
    pa: detectRomanizedPunjabi(tokens),
    ml: detectRomanizedMalayalam(tokens),
    od: detectRomanizedOdia(tokens),
  };

  let maxRomanizedLang: Language = 'en';
  let maxRomanizedScore = 0;

  for (const [lang, score] of Object.entries(romanizedScores)) {
    if (score > maxRomanizedScore) {
      maxRomanizedScore = score;
      maxRomanizedLang = lang as Language;
    }
  }

  // Conservative threshold: Require score >= 1 for clear markers
  if (maxRomanizedScore >= 1) {
    return maxRomanizedLang;
  }

  // Fallback to English for standard Latin text, numbers, punctuation, or ambiguous queries
  return 'en';
}

function detectRomanizedHindi(tokens: string[]): number {
  const strongMarkers = [
    'mujhe', 'mujko', 'mera', 'meri', 'mere', 'humara', 'humari', 'humare',
    'chahiye', 'chahie', 'chahiyen', 'sakta', 'sakti', 'sakte',
    'milega', 'milegi', 'milege', 'mileyga', 'hoga', 'hogi', 'hoge',
    'karna', 'karni', 'karne', 'kaise', 'kahan', 'kyun', 'kyu', 'kitna', 'kitni', 'kitne',
    'apna', 'apni', 'apne', 'batao', 'bataye', 'bataiye', 'rin', 'kist'
  ];
  const weakMarkers = ['kya', 'hai', 'hain', 'hu', 'hoon', 'tha', 'thi', 'the', 'kare', 'bhi', 'se'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedMarathi(tokens: string[]): number {
  const strongMarkers = [
    'mala', 'majha', 'majhi', 'majhe', 'amcha', 'amchi', 'amche', 'amala',
    'kasa', 'kashi', 'kashe', 'kothe', 'kiti', 'pahije', 'pahijat', 'hawa', 'hawe', 'hawi',
    'ahe', 'ahet', 'karayche', 'vhayche', 'bhetel', 'bhetat', 'nako', 'mahiti', 'karj', 'vyaj'
  ];
  const weakMarkers = ['nahi', 'nahit', 'madhye', 'sang', 'sanga'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedKannada(tokens: string[]): number {
  const strongMarkers = [
    'nanage', 'nannage', 'namma', 'nimma', 'yavudu', 'hege', 'elli', 'estu', 'yavaga', 'yake',
    'beku', 'bekagide', 'sigutta', 'siguthe', 'kodutara', 'maduvudu', 'madabeku',
    'shikshana', 'kalka', 'sala', 'sallam', 'baddi', 'bagge', 'wastu', 'helu', 'heli'
  ];
  const weakMarkers = ['illa', 'idhe', 'ide'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedTamil(tokens: string[]): number {
  const strongMarkers = [
    'enakku', 'enaku', 'ungalukku', 'yethu', 'eppadi', 'epdi', 'enge', 'evvalavu',
    'vendum', 'vendam', 'kidaikkuma', 'kedaikkum', 'seiyavendum', 'irukkuma',
    'kadan', 'kalvi', 'vaddi', 'patthi', 'patri', 'sollunga'
  ];
  const weakMarkers = ['namma', 'sollu', 'illai'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedTelugu(tokens: string[]): number {
  const strongMarkers = [
    'naaku', 'naku', 'maaku', 'meeku', 'yedi', 'ela', 'ekkada', 'entha',
    'kaavali', 'kavali', 'dhorukuthundhi', 'vasthundhi', 'cheyali', 'ledhu',
    'runam', 'chaduvu', 'gurinchi', 'cheppandi'
  ];
  const weakMarkers = ['cheppu', 'vaddi'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedBengali(tokens: string[]): number {
  const strongMarkers = [
    'amake', 'amar', 'amader', 'kivabe', 'kothay', 'koto',
    'dorkar', 'pabo', 'lagbe', 'parbo', 'shikkha', 'bolun'
  ];
  const weakMarkers = ['chai', 'hobe', 'rin'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedGujarati(tokens: string[]): number {
  const strongMarkers = [
    'mane', 'maru', 'mari', 'mara', 'kem', 'kyan', 'ketlu',
    'joie', 'joiae', 'chhe', 'chho', 'malse', 'karvu', 'bhanatar', 'dhiran', 'janao'
  ];
  const weakMarkers = ['nathi', 'vishe'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedPunjabi(tokens: string[]): number {
  const strongMarkers = [
    'mainu', 'saada', 'saadi', 'tuhanu', 'kiddan', 'kithay', 'kinna',
    'chahida', 'chahidi', 'chahide', 'mulega', 'hovega', 'karza', 'vyaaj', 'dasso'
  ];
  const weakMarkers = ['daso', 'karna'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedMalayalam(tokens: string[]): number {
  const strongMarkers = [
    'enikku', 'eniku', 'nammude', 'njangalkku', 'engane', 'evide', 'ethra',
    'venam', 'kittumo', 'nalkumo', 'vidyabhyasa', 'dhiram', 'parayu'
  ];
  const weakMarkers = ['illa', 'patty'];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}

function detectRomanizedOdia(tokens: string[]): number {
  const strongMarkers = [
    'mate', 'mora', 'ame', 'kemiti', 'kouthi', 'kete',
    'darakar', 'darakara', 'miliba', 'heba', 'kariba', 'rinn', 'jantu'
  ];
  const weakMarkers: string[] = [];

  let score = 0;
  for (const token of tokens) {
    if (strongMarkers.includes(token)) score += 2;
    else if (weakMarkers.includes(token)) score += 0.5;
  }
  return score;
}
