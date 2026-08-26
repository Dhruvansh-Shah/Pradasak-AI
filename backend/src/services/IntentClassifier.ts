export type IntentType =
  | 'scheme_recommendation'
  | 'scheme_eligibility'
  | 'scheme_information'
  | 'scheme_comparison'
  | 'education_loan'
  | 'business_loan'
  | 'emi_calculation'
  | 'document_requirements'
  | 'partner_locator'
  | 'partner_routing'
  | 'application_guidance'
  | 'general_information'
  | 'greeting'
  | 'fallback';

export type Language = 'en' | 'hi' | 'mr' | 'unknown';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  detectedLanguage: Language;
}

// Each keyword array covers EN + HI + MR synonyms
const KEYWORDS: Record<IntentType, string[]> = {
  greeting: [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings',
    'namaste', 'namaskar', 'नमस्ते', 'नमस्कार', 'हेलो', 'हाय', 'प्रणाम',
    'नमस्कार', 'हॅलो', 'सुप्रभात',
  ],
  emi_calculation: [
    'emi', 'equated monthly', 'monthly installment', 'monthly payment', 'monthly repayment',
    'calculate emi', 'compute emi', 'loan emi', 'repayment', 'how much per month', 'per month',
    'किस्त', 'मासिक किस्त', 'ईएमआई', 'महीने में कितना', 'हर महीने', 'calculate',
    'हप्ता', 'मासिक हप्ता', 'किती हप्ता', 'महिना किती', 'emi काढ',
  ],
  education_loan: [
    'education', 'study', 'studies', 'school', 'college', 'university', 'degree', 'diploma',
    'engineering', 'medical', 'mbbs', 'btech', 'mtech', 'course', 'admission', 'scholarship',
    'education loan', 'student loan', 'higher education', 'vocational', 'training',
    'शिक्षा', 'पढ़ाई', 'पढाई', 'कॉलेज', 'स्कूल', 'इंजीनियरिंग', 'मेडिकल',
    'शिक्षण', 'शिक्षा कर्ज', 'अभ्यास', 'विद्यालय', 'शैक्षणिक', 'प्रशिक्षण',
  ],
  business_loan: [
    'business', 'shop', 'enterprise', 'startup', 'small business', 'tailoring',
    'dairy', 'grocery', 'kirana', 'store', 'workshop', 'manufacturing', 'production',
    'trade', 'trading', 'income generating', 'self employment', 'livelihood',
    'handicraft', 'animal husbandry', 'poultry', 'agriculture', 'farming',
    'saas', 'software', 'tech', 'b2b', 'it services', 'supplier', 'suppliers', 'supply',
    'dealership', 'distributor', 'agency', 'wholesale', 'transport', 'hotel', 'restaurant',
    'व्यवसाय', 'दुकान', 'धंदा', 'व्यापार', 'बिजनेस', 'उद्योग', 'रोजगार',
    'स्वरोजगार', 'किराना', 'सिलाई', 'डेयरी', 'हस्तशिल्प', 'खेती',
    'व्यापार', 'उद्योग', 'धंदा', 'शेती', 'कुटीर उद्योग',
  ],
  scheme_recommendation: [
    'recommend', 'suggest', 'which scheme', 'suitable scheme', 'best scheme',
    'which loan', 'need a loan', 'want loan', 'apply for loan', 'financial assistance',
    'what money can i get', 'how much money', 'what money', 'get money', 'funding', 'funds',
    'capital', 'subsidy', 'subsidized loan', 'available schemes', 'loan options',
    'लोन चाहिए', 'ऋण चाहिए', 'कर्ज चाहिए', 'कौन सी योजना', 'योजना बताएं', 'कितना पैसा',
    'कुठली योजना', 'कर्ज हवे', 'कर्ज द्या', 'योग्य योजना', 'पैसे मिळतील',
  ],
  scheme_eligibility: [
    'eligible', 'eligibility', 'qualify', 'am i eligible', 'do i qualify',
    'check eligibility', 'am i allowed', 'can i get loan', 'criteria',
    'पात्रता', 'योग्य', 'पात्र', 'मैं पात्र', 'क्या मैं पात्र', 'apply कर सकता',
    'पात्र आहे का', 'अर्ज करू शकतो', 'अर्हता',
  ],
  scheme_comparison: [
    'compare', 'comparison', 'difference between', 'vs', 'versus', 'which is better',
    'contrast', 'side by side', 'compare schemes', 'better option',
    'तुलना', 'बेहतर', 'अंतर', 'कौन बेहतर', 'तुलना करें',
    'तुलना कर', 'तुलना करा', 'फरक',
  ],
  scheme_information: [
    'what is', 'tell me about', 'explain', 'details', 'information about',
    'describe', 'what are the terms', 'how does this scheme', 'scheme details',
    'क्या है', 'बताओ', 'जानकारी', 'विवरण', 'समझाइए', 'बताइए',
    'काय आहे', 'सांगा', 'माहिती',
  ],
  document_requirements: [
    'documents', 'document', 'paperwork', 'required documents', 'what documents',
    'papers needed', 'certificates', 'documentation', 'what to submit', 'list of documents',
    'कागज', 'दस्तावेज', 'प्रमाण पत्र', 'आवश्यक कागजात', 'कागज चाहिए',
    'कागदपत्रे', 'आवश्यक कागदे', 'दस्तऐवज',
  ],
  partner_locator: [
    'partner', 'partners', 'channel partner', 'channel partners', 'nearest partner', 'find nearest partner',
    'find partner', 'locate partner', 'nearest channel partner', 'bank branch', 'branch',
    'where', 'nearest', 'nearby', 'near me', 'closest', 'find office', 'office',
    'in my area', 'local office', 'find agency', 'sca near', 'sca',
    'where can i apply', 'where to apply', 'where should i go', 'where do i go', 'where to submit',
    'पार्टनर', 'चैनल पार्टनर', 'शाखा', 'बैंक शाखा', 'कहाँ', 'नजदीक', 'पास में', 'नजदीकी', 'मेरे पास', 'निकटतम',
    'भागीदार', 'चॅनेल पार्टनर', 'शाखा', 'कुठे', 'जवळ', 'जवळचे', 'जवळची', 'जवळचा',
  ],
  partner_routing: [
    'apply at', 'go to', 'contact', 'submit application', 'approach', 'find branch',
    'आवेदन', 'संपर्क', 'आवेदन करें', 'कहाँ जाएं',
    'अर्ज', 'कुठे जायचे', 'संपर्क करा',
  ],
  application_guidance: [
    'process', 'steps', 'procedure', 'application process', 'how to', 'guide',
    'what steps', 'what is the process',
    'प्रक्रिया', 'कदम', 'आवेदन प्रक्रिया', 'कैसे आवेदन',
    'प्रक्रिया काय', 'कसे अर्ज',
  ],
  general_information: [
    'nsfdc', 'what is nsfdc', 'about nsfdc', 'government scheme', 'sc benefit',
    'scheduled caste', 'what schemes are available', 'all schemes',
    'nsfdc क्या है', 'सरकारी योजना',
  ],
  fallback: [],
};

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

export function classifyIntent(
  message: string,
  sessionContext?: { lastIntent?: string; hasEntities?: boolean }
): ClassificationResult {
  const normalized = message.toLowerCase().trim();
  const detectedLanguage = detectLanguage(message);

  const scores: Record<string, number> = {};

  for (const [intent, keywords] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += kw.trim().split(/\s+/).length; // longer matches score higher
      }
    }
    if (score > 0) scores[intent] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // If the top intent is 'greeting' but the user also mentioned a business/loan/scheme topic or asked a longer question (> 4 words), prioritize the domain intent
  if (sorted.length > 0 && sorted[0][0] === 'greeting') {
    const domainIntent = sorted.find(([intent]) => intent !== 'greeting');
    const wordCount = message.trim().split(/\s+/).length;
    if (domainIntent && domainIntent[1] >= 1) {
      // Re-sort domain intent to the top
      sorted.splice(sorted.indexOf(domainIntent), 1);
      sorted.unshift(domainIntent);
    } else if (wordCount > 5) {
      // It's a full inquiry that just started with a hello/namaste
      sorted.shift(); // remove pure greeting
    }
  }

  if (sorted.length === 0) {
    // Detect numbers, LPA, lakh, or answers to previous questions
    const hasFinancialDetails =
      /[\d,]+\s*(lakh|lacs?|lpa|k|cr|rupees?|rs\.?|₹|लाख|रुपए|रुपये)/i.test(message) ||
      /\b(purpose|income|loan|amount|location|city|district|amravati|nagpur|pune|mumbai|महिला|सिलाई|व्यवसाय|दुकान)\b/i.test(message) ||
      /^\s*1\s*[-–:]/m.test(message);

    if (hasFinancialDetails || sessionContext?.lastIntent === 'scheme_recommendation' || sessionContext?.lastIntent === 'business_loan') {
      return { intent: 'scheme_recommendation', confidence: 0.75, detectedLanguage };
    }
    return { intent: 'fallback', confidence: 0.5, detectedLanguage };
  }

  const [bestIntent, bestScore] = sorted[0];
  const confidence = Math.min(0.95, 0.6 + (bestScore / 8) * 0.35);

  return { intent: bestIntent as IntentType, confidence, detectedLanguage };
}
