import { scoreSchemes } from '../services/SchemeEngine';
import { detectLanguage } from '../services/IntentClassifier';
import { geocodeCity } from '../services/LocationService';
import { mapSarvamSTTResponse } from '../services/STTService';
import { resolveEffectiveLanguage } from '../services/LanguageResolver';
import { OpenRouterError } from '../lib/openrouter';
import { LOCALIZED_ERROR_MESSAGES, buildSystemPrompt } from '../services/ChatOrchestrator';
import type { Scheme } from '../services/SchemeEngine';
import type { UserEntities } from '../services/ConversationSession';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

const mockSchemes: Scheme[] = [
  {
    id: 1,
    name: 'Micro Credit Finance (MCF)',
    category: 'micro_finance',
    description: 'Small loans for micro business',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 1.25,
    interest_rate_min: 6.5,
    interest_rate_max: 6.5,
    moratorium_months_min: 3,
    moratorium_months_max: 3,
    max_tenure_months: 36,
    coverage_percent: 90,
    eligible_project_types: ['small_trade', 'tailoring', 'grocery', 'repair_services'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 2,
    name: 'Mahila Samriddhi Yojana (MSY)',
    category: 'micro_finance',
    description: 'Exclusive micro-credit for women',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.05,
    max_loan_lakh: 1.25,
    interest_rate_min: 4.0,
    interest_rate_max: 4.0,
    moratorium_months_min: 3,
    moratorium_months_max: 6,
    max_tenure_months: 42,
    coverage_percent: 90,
    eligible_project_types: ['small_trade', 'tailoring', 'handicraft'],
    education_required: false,
    gender_eligibility: 'women_only',
  },
  {
    id: 6,
    name: 'Term Loan (TL)',
    category: 'term_loan',
    description: 'Flagship enterprise loan',
    min_income_lakh: 0,
    max_income_lakh: 5.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 27.0,
    interest_rate_min: 6.0,
    interest_rate_max: 8.0,
    moratorium_months_min: 6,
    moratorium_months_max: 12,
    max_tenure_months: 120,
    coverage_percent: 90,
    eligible_project_types: ['manufacturing', 'transport', 'grocery_wholesale', 'services'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 9,
    name: 'Swachhta Udayami Yojana (SUY)',
    category: 'term_loan',
    description: 'Sanitation enterprise loan',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 13.5,
    interest_rate_min: 3.0,
    interest_rate_max: 4.0,
    moratorium_months_min: 6,
    moratorium_months_max: 6,
    max_tenure_months: 120,
    coverage_percent: 90,
    eligible_project_types: ['sanitation_enterprise', 'waste_recycling', 'garbage_transport'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 12,
    name: 'Education Loan Scheme (ELS)',
    category: 'education_loan',
    description: 'Higher education in India/abroad',
    min_income_lakh: 0,
    max_income_lakh: 5.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 40.0,
    interest_rate_min: 3.5,
    interest_rate_max: 4.0,
    moratorium_months_min: 12,
    moratorium_months_max: 12,
    max_tenure_months: 144,
    coverage_percent: 90,
    eligible_project_types: ['education', 'engineering', 'medicine', 'management'],
    education_required: true,
    gender_eligibility: 'all',
  },
  {
    id: 3,
    name: 'Mahila Kisan Yojana (MKY)',
    category: 'term_loan',
    description: 'Loan for SC women engaged in agriculture and mixed farming',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 2.0,
    interest_rate_min: 5.0,
    interest_rate_max: 5.0,
    moratorium_months_min: 12,
    moratorium_months_max: 12,
    max_tenure_months: 120,
    coverage_percent: 90,
    eligible_project_types: ['agriculture', 'horticulture', 'dairy'],
    education_required: false,
    gender_eligibility: 'women_only',
  },
  {
    id: 13,
    name: 'Vocational Education & Training Loan Scheme (VETLS)',
    category: 'education_loan',
    description: 'Loan for short-term vocational courses',
    min_income_lakh: 0,
    max_income_lakh: 5.0,
    min_loan_lakh: 0.05,
    max_loan_lakh: 4.0,
    interest_rate_min: 3.5,
    interest_rate_max: 4.0,
    moratorium_months_min: 6,
    moratorium_months_max: 12,
    max_tenure_months: 84,
    coverage_percent: 90,
    eligible_project_types: ['vocational_training', 'skill_development'],
    education_required: true,
    gender_eligibility: 'all',
  },
];

console.log('\n================== RUNNING UNIT TESTS ==================\n');

// ── 1. Scheme Engine & Demographic Filter Tests ──
console.log('📦 Testing SchemeEngine (Demographics & Scoring):');

// Test 1.1: General/Male user should NOT receive Mahila scheme for general business purpose
const maleTailoring: UserEntities = { purpose: 'tailoring', loan_amount_rs: 100000, gender: 'male' };
const maleTailoringResults = scoreSchemes(mockSchemes, maleTailoring);
assert(
  !maleTailoringResults.some((s) => s.name.includes('Mahila')),
  'Male applicant does NOT receive Mahila schemes'
);

// Test 1.2: Unspecified gender user should NOT receive Mahila scheme for general business purpose
const generalGrocery: UserEntities = { purpose: 'grocery shop', loan_amount_rs: 100000 };
const generalGroceryResults = scoreSchemes(mockSchemes, generalGrocery);
assert(
  !generalGroceryResults.some((s) => s.name.includes('Mahila')),
  'Unspecified gender applicant does NOT receive Mahila schemes'
);

// Test 1.3: Direct scheme query for MSY ("Mahila Samriddhi Yojana (MSY)" & "MSY")
const directMsyFull = scoreSchemes(mockSchemes, { purpose: 'Mahila Samriddhi Yojana (MSY)' });
const directMsyShort = scoreSchemes(mockSchemes, { purpose: 'MSY' });
assert(
  directMsyFull[0]?.name.includes('Mahila Samriddhi Yojana') && directMsyFull[0]?.score >= 100,
  'Direct scheme query "Mahila Samriddhi Yojana (MSY)" resolves directly to MSY'
);
assert(
  directMsyShort[0]?.name.includes('Mahila Samriddhi Yojana') && directMsyShort[0]?.score >= 100,
  'Direct scheme query "MSY" resolves directly to MSY'
);

// Test 1.4: Direct scheme query for MKY ("Mahila Kisan Yojana" & "MKY")
const directMkyFull = scoreSchemes(mockSchemes, { purpose: 'Mahila Kisan Yojana' });
const directMkyShort = scoreSchemes(mockSchemes, { purpose: 'MKY' });
assert(
  directMkyFull[0]?.name.includes('Mahila Kisan Yojana') && directMkyFull[0]?.score >= 100,
  'Direct scheme query "Mahila Kisan Yojana" resolves directly to MKY'
);
assert(
  directMkyShort[0]?.name.includes('Mahila Kisan Yojana') && directMkyShort[0]?.score >= 100,
  'Direct scheme query "MKY" resolves directly to MKY'
);

// Test 1.5: Direct scheme query for VETLS ("Vocational Education & Training Loan Scheme" & "VETLS")
const directVetlsFull = scoreSchemes(mockSchemes, { purpose: 'Vocational Education & Training Loan Scheme (VETLS)' });
const directVetlsShort = scoreSchemes(mockSchemes, { purpose: 'VETLS' });
assert(
  directVetlsFull[0]?.name.includes('Vocational Education') && directVetlsFull[0]?.score >= 100,
  'Direct scheme query "Vocational Education & Training Loan Scheme" resolves directly to VETLS'
);
assert(
  directVetlsShort[0]?.name.includes('Vocational Education') && directVetlsShort[0]?.score >= 100,
  'Direct scheme query "VETLS" resolves directly to VETLS'
);

// Test 1.3: Female user receives Mahila Samriddhi Yojana with top rank
const femaleTailoring: UserEntities = { purpose: 'tailoring', loan_amount_rs: 100000, gender: 'female' };
const femaleTailoringResults = scoreSchemes(mockSchemes, femaleTailoring);
assert(
  femaleTailoringResults[0]?.name.includes('Mahila Samriddhi'),
  'Female applicant receives Mahila Samriddhi Yojana as top match'
);

// Test 1.4: Sanitation purpose specifically matches Swachhta Udayami Yojana
const wasteRecycling: UserEntities = { purpose: 'waste recycling vehicle', loan_amount_rs: 500000 };
const wasteResults = scoreSchemes(mockSchemes, wasteRecycling);
assert(
  wasteResults[0]?.name.includes('Swachhta Udayami'),
  'Waste management purpose specifically matches Swachhta Udayami Yojana'
);

// Test 1.5: Education purpose specifically matches Education Loan Scheme
const eduQuery: UserEntities = { purpose: 'MS in Computer Science', loan_amount_rs: 2000000, course: 'MS' };
const eduResults = scoreSchemes(mockSchemes, eduQuery);
assert(
  eduResults[0]?.name.includes('Education Loan Scheme'),
  'Academic purpose matches Education Loan Scheme'
);

// Test 1.6: High income generates warning without disqualifying Term Loan
const highIncome: UserEntities = { purpose: 'manufacturing enterprise', loan_amount_rs: 1000000, family_income_rs: 1000000 };
const highIncomeResults = scoreSchemes(mockSchemes, highIncome);
assert(
  highIncomeResults.length > 0 && highIncomeResults[0].warnings.length > 0,
  'Income > ₹5L attaches clear warning without discarding scheme'
);

// Test 1.7: Non-English Kannada education loan query matches Education Loan Scheme (not GBS)
const kannadaEduQuery: UserEntities = { purpose: 'ನನಗೆ ಎಂಜಿನಿಯರಿಂಗ್‌ಗೆ 3 ಲಕ್ಷ ಶಿಕ್ಷಣ ಸಾಲ ಬೇಕು', loan_amount_rs: 300000 };
const kannadaEduResults = scoreSchemes(mockSchemes, kannadaEduQuery);
assert(
  kannadaEduResults[0]?.name.includes('Education Loan Scheme') && !kannadaEduResults[0]?.name.includes('Green Business Scheme'),
  'Kannada education loan query matches Education Loan Scheme (not Green Business Scheme)'
);

// ── 2. Language Detection Tests ──
console.log('\n🧠 Testing Language Detection (All 11 Supported Languages):');

// All 11 supported languages
assert(detectLanguage('I need an education loan') === 'en', 'English detected as "en"');
assert(detectLanguage('मुझे शिक्षा ऋण चाहिए') === 'hi', 'Hindi Devanagari detected as "hi"');
assert(detectLanguage('मला शिक्षणासाठी कर्ज हवे आहे') === 'mr', 'Marathi Devanagari detected as "mr"');
assert(detectLanguage('আমাকে শিক্ষা ঋণ দরকার') === 'bn', 'Bengali script detected as "bn"');
assert(detectLanguage('મને શિક્ષણ લોન જોઈએ છે') === 'gu', 'Gujarati script detected as "gu"');
assert(detectLanguage('ನನಗೆ ಶಿಕ್ಷಣ ಸಾಲ ಬೇಕು') === 'kn', 'Kannada script detected as "kn"');
assert(detectLanguage('എനിക്ക് വിദ്യാഭ്യാസ വായ്പ വേണം') === 'ml', 'Malayalam script detected as "ml"');
assert(detectLanguage('ମୋତେ ଶିକ୍ଷା ଋଣ ଦରକାର') === 'od', 'Odia script detected as "od"');
assert(detectLanguage('ਮੈਨੂੰ ਸਿੱਖਿਆ ਕਰਜ਼ਾ ਚਾਹੀਦਾ ਹੈ') === 'pa', 'Punjabi Gurmukhi script detected as "pa"');
assert(detectLanguage('எனக்கு கல்வி கடன் வேண்டும்') === 'ta', 'Tamil script detected as "ta"');
assert(detectLanguage('నాకు విద్య రుణం కావాలి') === 'te', 'Telugu script detected as "te"');

// Mixed script and edge cases
assert(detectLanguage('मुझे education loan चाहिए') === 'hi', 'Hindi + English mixed script detected as "hi"');
assert(detectLanguage('मला education loan हवे आहे') === 'mr', 'Marathi + English mixed script detected as "mr"');
assert(detectLanguage('ನನಗೆ B.Tech engineering ಶಿಕ್ಷಣ ಸಾಲ ಬೇಕು') === 'kn', 'Kannada + English technical terms detected as "kn"');
assert(detectLanguage('₹5,000,000 / 7% ವಿಆಜದರದಲ್ಲಿ 3 ಲಕ್ಷ') === 'kn', 'Numbers and currency mixed with native script detected as "kn"');
assert(detectLanguage('') === 'en', 'Empty input safely falls back to "en"');
assert(detectLanguage('   !!! ??? ₹$ %^&  ') === 'en', 'Punctuation/symbols input safely falls back to "en"');

// ── 3. STT Automatic Speech-Language Response Mapping Tests ──
console.log('\n🎙️ Testing STT Automatic Speech-Language Response Mapping:');

const sttResult1 = mapSarvamSTTResponse({ transcript: '  नमस्ते  ', language_code: 'hi-IN', language_probability: 0.98 });
assert(sttResult1.transcript === 'नमस्ते', 'STT transcript is cleanly trimmed');
assert(sttResult1.languageCode === 'hi-IN', 'detectedLanguageCode correctly mapped from Sarvam language_code');
assert(sttResult1.languageProbability === 0.98, 'languageProbability correctly mapped from Sarvam language_probability');

const sttResult2 = mapSarvamSTTResponse({ transcript: 'Hello world', language_code: undefined, language_probability: undefined });
assert(sttResult2.languageCode === null, 'Missing language_code safely mapped to null');
assert(sttResult2.languageProbability === null, 'Missing language_probability safely mapped to null');

const sttResult3 = mapSarvamSTTResponse({ transcript: 'Bonjour', language_code: 'fr-FR', language_probability: 0.85 });
assert(sttResult3.languageCode === 'fr-FR', 'Unsupported language code returned safely without crash or forced English mapping');

// ── 4. Effective Language Resolution Tests ──
console.log('\n🌐 Testing Effective Language Resolution (resolveEffectiveLanguage):');

// TEST 1 — Explicit selection wins
const res1 = resolveEffectiveLanguage({ selectedLanguage: 'kn', detectedSpeechLanguage: 'ta-IN', message: 'எனக்கு கடன் வேண்டும்' });
assert(res1.effectiveLanguage === 'kn' && res1.resolutionSource === 'user_selection', 'TEST 1: Explicit user selection wins over speech/text detection');

// TEST 2 — Speech detection used when no explicit selection
const res2 = resolveEffectiveLanguage({ selectedLanguage: undefined, detectedSpeechLanguage: 'ta-IN', speechProbability: 0.95 });
assert(res2.effectiveLanguage === 'ta' && res2.resolutionSource === 'speech_detection', 'TEST 2: Speech detection used when no explicit user selection');

// TEST 3 — Text detection fallback
const res3 = resolveEffectiveLanguage({ selectedLanguage: undefined, detectedSpeechLanguage: undefined, message: 'ನನಗೆ ಶಿಕ್ಷಣ ಸಾಲ ಬೇಕು' });
assert(res3.effectiveLanguage === 'kn' && res3.resolutionSource === 'text_detection', 'TEST 3: Text detection fallback used when no selection or speech detection');

// TEST 4 — Hinglish
const res4 = resolveEffectiveLanguage({ selectedLanguage: 'hi', message: 'Mujhe engineering ke liye education loan chahiye.' });
assert(res4.effectiveLanguage === 'hi' && res4.resolutionSource === 'user_selection', 'TEST 4: Explicit Hindi selection preserved for Hinglish query');

// TEST 5 — Unsupported selected language
const res5 = resolveEffectiveLanguage({ selectedLanguage: 'fr' });
assert(res5.isSupported === false && res5.resolutionSource === 'unsupported_selection', 'TEST 5: Unsupported selected language handled in controlled manner without crash');

// TEST 6 — No usable language information
const res6 = resolveEffectiveLanguage({ selectedLanguage: undefined, detectedSpeechLanguage: undefined, message: '12345 !@#$' });
assert(res6.effectiveLanguage === 'en' && res6.resolutionSource === 'fallback', 'TEST 6: Fallback to English when no usable language information present');

// TEST 7 — All 11 supported languages
const allLangs = ['en', 'hi', 'mr', 'bn', 'gu', 'kn', 'ml', 'od', 'pa', 'ta', 'te'];
let allPassed = true;
for (const l of allLangs) {
  const r = resolveEffectiveLanguage({ selectedLanguage: l });
  if (r.effectiveLanguage !== l || r.resolutionSource !== 'user_selection') {
    allPassed = false;
  }
}
assert(allPassed, 'TEST 7: All 11 supported languages resolve correctly');

// REGRESSION TEST — Hindi vs Punjabi Mapping Verification
const hindiRes = resolveEffectiveLanguage({ selectedLanguage: 'hi' });
assert(
  hindiRes.effectiveLanguage === 'hi' && hindiRes.languageConfig?.name === 'Hindi' && hindiRes.languageConfig?.nativeName === 'हिंदी',
  'REGRESSION TEST: "hi" maps strictly to Hindi (हिंदी) and never resolves to Punjabi (ਪੰਜਾਬੀ)'
);
const punjabiRes = resolveEffectiveLanguage({ selectedLanguage: 'pa' });
assert(
  punjabiRes.effectiveLanguage === 'pa' && punjabiRes.languageConfig?.name === 'Punjabi' && punjabiRes.languageConfig?.nativeName === 'ਪੰਜਾਬੀ',
  'REGRESSION TEST: "pa" maps strictly to Punjabi (ਪੰਜਾਬੀ)'
);

// ── 5. Location Service Tests ──
console.log('\n📍 Testing LocationService:');

const amravatiPt = geocodeCity('amravati');
assert(amravatiPt !== null && Math.abs(amravatiPt.lat - 20.9374) < 0.01, 'Amravati coordinates accurately mapped');

const nagpurPt = geocodeCity('nagpur');
assert(nagpurPt !== null && Math.abs(nagpurPt.lat - 21.1458) < 0.01, 'Nagpur coordinates accurately mapped');

// ── 6. OpenRouter Error Handling & Token Budget Robustness Tests ──
console.log('\n🛡️ Testing OpenRouter Error Handling & Token Budget Robustness:');

const creditErr = new OpenRouterError(402, 'This request requires more credits, or fewer max_tokens. You requested up to 700 tokens, but can only afford 675. Key: sk-or-v1-abcdef123456789');
assert(creditErr.status === 402 && creditErr.isCreditError === true, 'HTTP 402 correctly classified as credit/budget error');
assert(!creditErr.message.includes('sk-or-v1-abcdef123456789') && creditErr.message.includes('[REDACTED]'), 'Secret API key is masked in error message');

const rateLimitErr = new OpenRouterError(429, 'Rate limit exceeded');
assert(rateLimitErr.status === 429 && rateLimitErr.isRateLimit === true && rateLimitErr.isCreditError === false, 'HTTP 429 correctly classified as rate limit error');

const serverErr = new OpenRouterError(503, 'Service Unavailable');
assert(serverErr.status === 503 && serverErr.isServerError === true, 'HTTP 5xx correctly classified as server error');

const all11Langs = ['en', 'hi', 'mr', 'bn', 'gu', 'kn', 'ml', 'od', 'pa', 'ta', 'te'];
const allLangsHaveFallback = all11Langs.every((lang) => typeof LOCALIZED_ERROR_MESSAGES[lang] === 'string' && LOCALIZED_ERROR_MESSAGES[lang].length > 0);
assert(allLangsHaveFallback, 'All 11 supported languages have non-empty localized fallback error messages');

// ── 7. Automatic UI Language & Auto Mode Tests ──
console.log('\n🌐 Testing Automatic UI Language & Auto Mode Behavior:');

// Test 7.1: Explicit selection 'hi' ignores Kannada input text detection
const explicitHi = resolveEffectiveLanguage({ selectedLanguage: 'hi', message: 'ನನಗೆ ಸಾಲ ಬೇಕು' });
assert(explicitHi.effectiveLanguage === 'hi' && explicitHi.resolutionSource === 'user_selection', 'Explicit Hindi selection overrides native Kannada text detection');

// Test 7.2: Explicit selection 'kn' ignores Tamil speech detection
const explicitKn = resolveEffectiveLanguage({ selectedLanguage: 'kn', detectedSpeechLanguage: 'ta-IN', speechProbability: 0.95 });
assert(explicitKn.effectiveLanguage === 'kn' && explicitKn.resolutionSource === 'user_selection', 'Explicit Kannada selection overrides high-confidence Tamil speech detection');

// Test 7.3: Auto mode ('auto') allows native Kannada text detection
const autoKn = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'ನನಗೆ ಸಾಲ ಬೇಕು' });
assert(autoKn.effectiveLanguage === 'kn' && autoKn.resolutionSource === 'text_detection', 'Auto mode permits native Kannada script text detection');

// Test 7.4: Auto mode ('auto') allows Tamil speech detection
const autoTa = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'ta-IN', speechProbability: 0.95 });
assert(autoTa.effectiveLanguage === 'ta' && autoTa.resolutionSource === 'speech_detection', 'Auto mode permits high-confidence Tamil speech detection');

// Test 7.5: Auto mode ('auto') with ambiguous text safely falls back to English
const autoAmbiguous = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: '12345 !@#$' });
assert(autoAmbiguous.effectiveLanguage === 'en' && autoAmbiguous.resolutionSource === 'fallback', 'Auto mode with ambiguous input safely falls back to English');

// Test 7.6: Unsupplied selectedLanguage (new user default) permits automatic text language detection
const newUserRes = resolveEffectiveLanguage({ selectedLanguage: undefined, message: 'मुझे शिक्षा ऋण चाहिए' });
assert(newUserRes.effectiveLanguage === 'hi' && newUserRes.resolutionSource === 'text_detection', 'Unsupplied selectedLanguage (new user default) permits automatic text language detection');

// ── 8. Romanized Indian Language Detection & Resolution Tests ──
console.log('\n🔤 Testing Romanized Indian Language Detection & Resolution:');

// Test 8.1: Romanized Hindi "mujhe loan chahiye" -> hi
assert(detectLanguage('mujhe loan chahiye') === 'hi', 'Romanized Hindi "mujhe loan chahiye" detected as "hi"');

// Test 8.2: Romanized Hindi "mujhe shiksha rin chahiye" -> hi
assert(detectLanguage('mujhe shiksha rin chahiye') === 'hi', 'Romanized Hindi "mujhe shiksha rin chahiye" detected as "hi"');

// Test 8.3: Romanized Marathi "mala loan pahije" -> mr
assert(detectLanguage('mala loan pahije') === 'mr', 'Romanized Marathi "mala loan pahije" detected as "mr"');

// Test 8.4: Romanized Kannada "nanage shikshana sala beku" -> kn
assert(detectLanguage('nanage shikshana sala beku') === 'kn', 'Romanized Kannada "nanage shikshana sala beku" detected as "kn"');

// Test 8.5: Normal English "I need an education loan" -> en
assert(detectLanguage('I need an education loan') === 'en', 'Normal English "I need an education loan" detected as "en"');

// Test 8.6: Ambiguous "loan" -> en
assert(detectLanguage('loan') === 'en', 'Ambiguous term "loan" safely falls back to "en"');

// Test 8.7: Explicit Hindi selection overrides Romanized Kannada input
const explicitHiRoman = resolveEffectiveLanguage({ selectedLanguage: 'hi', message: 'nanage shikshana sala beku' });
assert(explicitHiRoman.effectiveLanguage === 'hi' && explicitHiRoman.resolutionSource === 'user_selection', 'Explicit Hindi selection overrides Romanized Kannada input');

// Test 8.8: Explicit Kannada selection overrides Romanized Hindi input
const explicitKnRoman = resolveEffectiveLanguage({ selectedLanguage: 'kn', message: 'mujhe loan chahiye' });
assert(explicitKnRoman.effectiveLanguage === 'kn' && explicitKnRoman.resolutionSource === 'user_selection', 'Explicit Kannada selection overrides Romanized Hindi input');

// Test 8.9: Auto mode with Romanized Hindi resolves effective language to hi
const autoHiRoman = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'mujhe loan chahiye' });
assert(autoHiRoman.effectiveLanguage === 'hi' && autoHiRoman.resolutionSource === 'text_detection', 'Auto mode resolves Romanized Hindi to "hi" via text detection');

// Test 8.10: Auto mode with Romanized Kannada resolves effective language to kn
const autoKnRoman = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'nanage shikshana sala beku' });
assert(autoKnRoman.effectiveLanguage === 'kn' && autoKnRoman.resolutionSource === 'text_detection', 'Auto mode resolves Romanized Kannada to "kn" via text detection');

// ── 9. Turn-by-Turn Auto Language & System Prompt Tests ──
console.log('\n🔄 Testing Turn-by-Turn Auto Language & System Prompt Scoping:');

// Test 9.1: English system prompt does not contain anti-English switching instruction
const enPrompt = buildSystemPrompt('en');
assert(!enPrompt.includes('Do NOT randomly switch the entire response to English'), 'English system prompt omits anti-English switching text');
assert(enPrompt.includes('Respond strictly in English'), 'English system prompt includes strict English instruction');

// Test 9.2: Hindi system prompt includes anti-English switching instruction
const hiPrompt = buildSystemPrompt('hi');
assert(hiPrompt.includes('Do NOT randomly switch the entire response to English'), 'Hindi system prompt includes anti-English switching text');

// Test 9.3: Turn 1 in Auto mode with Hindi prompt resolves to hi
const turn1Auto = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'mujhe loan chahiye' });
assert(turn1Auto.effectiveLanguage === 'hi', 'Auto mode Turn 1 (Hindi) resolves to "hi"');

// Test 9.4: Turn 2 in Auto mode with English prompt resolves to en (no language leakage)
const turn2Auto = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'what are the required documents for education loan' });
assert(turn2Auto.effectiveLanguage === 'en', 'Auto mode Turn 2 (English) resolves to "en" regardless of Turn 1 history');

// Test 9.5: Turn 3 in Auto mode with Kannada prompt resolves to kn
const turn3Auto = resolveEffectiveLanguage({ selectedLanguage: 'auto', message: 'nanage shikshana sala beku' });
assert(turn3Auto.effectiveLanguage === 'kn', 'Auto mode Turn 3 (Kannada) resolves to "kn"');

// ── 10. Category Mismatch System Prompt Tests ──
console.log('\n🎯 Testing Category Mismatch System Prompt Rules:');

// Test 10.1: Education category system prompt includes Business Loan mismatch rule
const eduPrompt = buildSystemPrompt('en', 'education');
assert(eduPrompt.includes('User selected card category: "Education Loan"'), 'System prompt contains Education Loan category context');
assert(eduPrompt.includes('Business Loan'), 'System prompt contains Business Loan mismatch guidance');

// Test 10.2: Small Business category system prompt includes Education Loan mismatch rule
const bizPrompt = buildSystemPrompt('hi', 'small-business');
assert(bizPrompt.includes('User selected card category: "Business / Entrepreneurship Loan"'), 'System prompt contains Business Loan category context');
assert(bizPrompt.includes('Education Loan'), 'System prompt contains Education Loan mismatch guidance');

// Test 10.3: Women Exclusive category system prompt includes category context
const womenPrompt = buildSystemPrompt('kn', 'women-exclusive');
assert(womenPrompt.includes('User selected card category: "Mahila Samriddhi Yojana (Women Exclusive)"'), 'System prompt contains Women Exclusive category context');

console.log(`\n================== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ==================\n`);
process.exit(failed > 0 ? 1 : 0);
