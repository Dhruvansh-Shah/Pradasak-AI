import { classifyIntent, detectLanguage } from './IntentClassifier';
import type { Language } from './IntentClassifier';
import { getOrCreate, updateSession, mergeEntities } from './ConversationSession';
import type { Session } from './ConversationSession';
import { extractEntities } from './EntityExtractor';
import { recommendSchemes, fetchSchemeById, fetchSchemeByName, scoreSchemes, fetchActiveSchemes } from './SchemeEngine';
import type { Scheme, ScoredScheme } from './SchemeEngine';
import { geocode, findNearbyPartners } from './LocationService';
import { llmCall } from '../lib/openrouter';

// ── EMI math ─────────────────────────────────────────────────────────────────

function calcEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

// ── Response types ────────────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  labelHi: string;
  message: string; // what to send to /api/chat when clicked
}

export interface ChatApiResponse {
  sessionId: string;
  message: string;
  type: 'text' | 'schemes' | 'emi' | 'partners' | 'comparison' | 'documents' | 'question';
  data?: Record<string, unknown>;
  quickActions?: QuickAction[];
  disclaimer?: string;
  detectedLanguage: Language;
  intent: string;
}

// ── Disclaimer ────────────────────────────────────────────────────────────────

const DISCLAIMER: Record<Language, string> = {
  en: 'This recommendation is based on the information you provided. Final eligibility, sanction and disbursement are subject to verification by the authorized Channel Partner.',
  hi: 'यह सिफारिश आपके द्वारा प्रदान की गई जानकारी पर आधारित है। अंतिम पात्रता, स्वीकृति और वितरण अधिकृत चैनल पार्टनर द्वारा सत्यापन के अधीन है।',
  mr: 'ही शिफारस आपण दिलेल्या माहितीवर आधारित आहे. अंतिम पात्रता, मंजुरी आणि वितरण अधिकृत चॅनेल पार्टनरच्या सत्यापनाच्या अधीन आहे.',
  unknown: 'This recommendation is based on the information you provided and the scheme data available in the system.',
};

// ── LLM response generator ────────────────────────────────────────────────────

async function llmReply(prompt: string, language: Language, maxTokens = 512): Promise<string> {
  const langInstr = language === 'hi' ? 'Respond in Hindi.' :
    language === 'mr' ? 'Respond in Marathi.' : 'Respond in English.';

  return llmCall({
    systemPrompt: `You are a helpful, warm financial advisor for Indian SC beneficiaries seeking government loan schemes. Be concise. ${langInstr}`,
    userMessage: prompt,
    maxTokens,
  });
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handleGreeting(session: Session): Promise<ChatApiResponse> {
  const msgs: Record<Language, string> = {
    en: "Hello! I'm here to help you find the right government loan scheme for Scheduled Caste beneficiaries. You can ask me about:\n\n• Loan schemes for business or education\n• EMI calculation\n• Nearest Channel Partners\n• Eligibility and required documents\n\nHow can I assist you today?",
    hi: "नमस्ते! मैं अनुसूचित जाति लाभार्थियों के लिए सही सरकारी ऋण योजना खोजने में आपकी मदद करने के लिए यहाँ हूँ। आप मुझसे पूछ सकते हैं:\n\n• व्यवसाय या शिक्षा के लिए ऋण योजनाएं\n• EMI गणना\n• नजदीकी चैनल पार्टनर\n• पात्रता और आवश्यक दस्तावेज\n\nआज मैं आपकी कैसे सहायता कर सकता हूँ?",
    mr: "नमस्कार! अनुसूचित जातीच्या लाभार्थ्यांसाठी योग्य सरकारी कर्ज योजना शोधण्यासाठी मी येथे आहे. तुम्ही मला विचारू शकता:\n\n• व्यवसाय किंवा शिक्षणासाठी कर्ज योजना\n• EMI गणना\n• जवळचे चॅनेल पार्टनर\n• पात्रता आणि आवश्यक कागदपत्रे\n\nआज मी तुम्हाला कशी मदत करू शकतो?",
    unknown: "Hello! I'm here to help you find the right government loan scheme for SC beneficiaries. How can I assist you?",
  };

  return {
    sessionId: session.id,
    message: msgs[session.language] || msgs.en,
    type: 'text',
    quickActions: [
      { label: 'Find a loan scheme', labelHi: 'ऋण योजना खोजें', message: 'I need a loan for my business' },
      { label: 'Education loan', labelHi: 'शिक्षा ऋण', message: 'I need an education loan' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI' },
      { label: 'Find nearest partner', labelHi: 'नजदीकी पार्टनर', message: 'Where can I apply near me?' },
    ],
    detectedLanguage: session.language,
    intent: 'greeting',
  };
}

async function handleSchemeRecommendation(session: Session, categoryHint?: string): Promise<ChatApiResponse> {
  const { entities } = session;

  // Ask for minimum information if we have nothing
  if (!entities.loan_amount_rs && !entities.purpose && !entities.family_income_rs) {
    const qs: Record<Language, string> = {
      en: "I'd be happy to recommend the right loan scheme! Could you tell me:\n1. What is your approximate annual family income?\n2. What do you need the loan for (e.g. business, education, farming)?\n3. How much loan do you need?",
      hi: "मैं सही ऋण योजना की सिफारिश करने के लिए खुश हूँगा! क्या आप बता सकते हैं:\n1. आपकी अनुमानित वार्षिक पारिवारिक आय क्या है?\n2. आप किस उद्देश्य के लिए ऋण लेना चाहते हैं?\n3. आपको कितने रुपये का ऋण चाहिए?",
      mr: "मी योग्य कर्ज योजना सुचवण्यास आनंदी आहे! कृपया सांगा:\n1. तुमचे अंदाजे वार्षिक कौटुंबिक उत्पन्न किती आहे?\n2. कर्ज कशासाठी हवे आहे?\n3. किती रुपयांचे कर्ज हवे आहे?",
      unknown: "To recommend the best scheme, please tell me your annual income, purpose, and required loan amount.",
    };
    return {
      sessionId: session.id,
      message: qs[session.language] || qs.en,
      type: 'question',
      detectedLanguage: session.language,
      intent: 'scheme_recommendation',
    };
  }

  // Run recommendation engine
  const schemes = await recommendSchemes(entities, categoryHint);

  if (schemes.length === 0) {
    const msg = await llmReply(
      `The user (income: ₹${entities.family_income_rs || 'unknown'}, purpose: ${entities.purpose || 'unknown'}, amount: ₹${entities.loan_amount_rs || 'unknown'}) found no matching schemes. Explain possible reasons kindly and suggest they visit the nearest NSFDC office.`,
      session.language
    );
    return {
      sessionId: session.id,
      message: msg,
      type: 'text',
      detectedLanguage: session.language,
      intent: 'scheme_recommendation',
    };
  }

  // Save in session
  session.recommendedSchemes = schemes as unknown as Record<string, unknown>[];
  session.selectedScheme = schemes[0] as unknown as Record<string, unknown>;

  const top = schemes[0];

  // Generate grounded explanation using LLM
  const prompt = `
User profile: income=${entities.family_income_rs ? '₹' + entities.family_income_rs : 'unspecified'}, purpose=${entities.purpose || 'unspecified'}, loan_needed=${entities.loan_amount_rs ? '₹' + entities.loan_amount_rs : 'unspecified'}

Top recommended scheme: ${top.name}
- Interest: ${top.interest_rate_min}%–${top.interest_rate_max}% p.a.
- Max loan: ₹${(top.max_loan_lakh * 100000).toLocaleString('en-IN')} (₹${top.max_loan_lakh}L)
- Income limit: ₹${top.max_income_lakh}L/year
- Moratorium: ${top.moratorium_months_min}–${top.moratorium_months_max} months
- Max tenure: ${top.max_tenure_months} months
- Coverage: ${top.coverage_percent || 90}% of project cost

Match reasons: ${top.matchReasons.join('; ')}

Write 2–3 sentences explaining why this scheme is recommended. Use ONLY the numbers above. Never invent rates or limits. End with: "You appear eligible based on your information — final verification will be done by the Channel Partner."
  `.trim();

  const explanation = await llmReply(prompt, session.language, 384);

  return {
    sessionId: session.id,
    message: explanation,
    type: 'schemes',
    data: { schemes: schemes.slice(0, 3) },
    quickActions: [
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for the recommended scheme' },
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply for this?' },
      { label: 'Documents needed', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
      { label: 'Compare schemes', labelHi: 'तुलना करें', message: 'Compare the recommended schemes' },
    ],
    disclaimer: DISCLAIMER[session.language],
    detectedLanguage: session.language,
    intent: 'scheme_recommendation',
  };
}

async function handleEMICalculation(session: Session): Promise<ChatApiResponse> {
  const { entities } = session;
  const scheme = session.selectedScheme as unknown as Scheme | undefined;

  // Try to get values from session (scheme defaults fill gaps)
  const principal = entities.loan_amount_rs || (scheme ? scheme.max_loan_lakh * 100000 * 0.8 : null);
  const rate = entities.interest_rate_pct || (scheme ? (scheme.interest_rate_min + scheme.interest_rate_max) / 2 : null);
  const tenure = entities.tenure_months || (scheme ? scheme.max_tenure_months : null);
  const moratorium = entities.moratorium_months || (scheme ? scheme.moratorium_months_min : 0);

  if (!principal || !rate || !tenure) {
    const missing = [];
    if (!principal) missing.push('loan amount');
    if (!rate) missing.push('interest rate (%)');
    if (!tenure) missing.push('repayment tenure (months)');

    const qs: Record<Language, string> = {
      en: `To calculate EMI, I need: ${missing.join(', ')}. Please provide these details.`,
      hi: `EMI गणना के लिए मुझे चाहिए: ${missing.join(', ')}। कृपया ये विवरण दें।`,
      mr: `EMI गणना करण्यासाठी मला हवे: ${missing.join(', ')}। कृपया हे तपशील द्या.`,
      unknown: `Please provide: ${missing.join(', ')}.`,
    };

    return {
      sessionId: session.id,
      message: qs[session.language] || qs.en,
      type: 'question',
      detectedLanguage: session.language,
      intent: 'emi_calculation',
    };
  }

  // Moratorium: interest accrues, capitalises
  let effectivePrincipal = principal;
  if (moratorium > 0) {
    const r = rate / 100 / 12;
    for (let i = 0; i < moratorium; i++) effectivePrincipal *= (1 + r);
  }

  const emi = calcEMI(effectivePrincipal, rate, tenure);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - principal;

  const msgs: Record<Language, string> = {
    en: `Here's the EMI breakdown for ${scheme ? `the **${scheme.name}** scheme` : 'your loan'}:`,
    hi: `${scheme ? `**${scheme.name}** योजना` : 'आपके ऋण'} के लिए EMI विवरण यहाँ है:`,
    mr: `${scheme ? `**${scheme.name}** योजना` : 'तुमच्या कर्जा'}साठी EMI तपशील:`,
    unknown: 'Here is the EMI calculation:',
  };

  return {
    sessionId: session.id,
    message: msgs[session.language] || msgs.en,
    type: 'emi',
    data: {
      emi: Math.round(emi),
      totalPayable: Math.round(totalPayable),
      totalInterest: Math.round(totalInterest),
      params: { principal, rate, tenureMonths: tenure, moratoriumMonths: moratorium },
      schemeName: scheme?.name,
    },
    quickActions: [
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply for this loan?' },
      { label: 'Documents needed', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
    ],
    detectedLanguage: session.language,
    intent: 'emi_calculation',
  };
}

async function handlePartnerLocator(session: Session): Promise<ChatApiResponse> {
  const { entities } = session;
  const scheme = session.selectedScheme as unknown as Scheme | undefined;

  if (!entities.location) {
    const qs: Record<Language, string> = {
      en: 'Which city or district are you in? I\'ll find the nearest authorized Channel Partners.',
      hi: 'आप किस शहर या जिले में हैं? मैं निकटतम अधिकृत चैनल पार्टनर खोजूँगा।',
      mr: 'तुम्ही कोणत्या शहरात किंवा जिल्ह्यात आहात? मी जवळचे अधिकृत चॅनेल पार्टनर शोधतो.',
      unknown: 'Please tell me your city or district.',
    };
    return {
      sessionId: session.id,
      message: qs[session.language] || qs.en,
      type: 'question',
      detectedLanguage: session.language,
      intent: 'partner_locator',
    };
  }

  const point = await geocode(entities.location);
  if (!point) {
    const msg: Record<Language, string> = {
      en: `I couldn't find "${entities.location}" on the map. Could you provide a larger nearby city or the PIN code?`,
      hi: `मुझे "${entities.location}" मानचित्र पर नहीं मिला। क्या आप कोई बड़ा नजदीकी शहर या PIN कोड दे सकते हैं?`,
      mr: `"${entities.location}" नकाशावर सापडले नाही. कृपया जवळचे मोठे शहर किंवा PIN कोड द्या.`,
      unknown: `Couldn't find "${entities.location}". Please provide a nearby city.`,
    };
    return {
      sessionId: session.id,
      message: msg[session.language] || msg.en,
      type: 'question',
      detectedLanguage: session.language,
      intent: 'partner_locator',
    };
  }

  const category = scheme?.category as string | undefined;
  const partners = await findNearbyPartners(point, category, 150, 5);

  if (partners.length === 0) {
    const msg = await llmReply(
      `No Channel Partners found within 150 km of ${entities.location} for category ${category || 'any'}. Suggest the user contact NSFDC HQ or visit nsfdc.org.`,
      session.language, 256
    );
    return {
      sessionId: session.id,
      message: msg,
      type: 'text',
      detectedLanguage: session.language,
      intent: 'partner_locator',
    };
  }

  const msgs: Record<Language, string> = {
    en: `Found ${partners.length} Channel Partner${partners.length > 1 ? 's' : ''} near ${entities.location}:`,
    hi: `${entities.location} के पास ${partners.length} चैनल पार्टनर मिले:`,
    mr: `${entities.location} जवळ ${partners.length} चॅनेल पार्टनर सापडले:`,
    unknown: `Found ${partners.length} partners near ${entities.location}.`,
  };

  return {
    sessionId: session.id,
    message: msgs[session.language] || msgs.en,
    type: 'partners',
    data: { partners, location: entities.location },
    detectedLanguage: session.language,
    intent: 'partner_locator',
  };
}

async function handleDocumentRequirements(session: Session): Promise<ChatApiResponse> {
  const scheme = session.selectedScheme as unknown as Scheme | undefined;

  const defaultDocs = [
    'Aadhaar Card (applicant and co-applicants)',
    'Caste Certificate (SC category)',
    'Income Certificate (annual family income)',
    'Passport-size photographs',
    'Bank account details (passbook/statement)',
    'Project/Business Plan or Quotation',
    'Land/property documents (if applicable)',
    'Educational certificates (for education loans)',
  ];

  const docs = (scheme?.documents_required && scheme.documents_required.length > 0)
    ? scheme.documents_required
    : defaultDocs;

  const msgs: Record<Language, string> = {
    en: `Documents typically required${scheme ? ` for **${scheme.name}**` : ''}:`,
    hi: `${scheme ? `**${scheme.name}** के लिए` : ''} आमतौर पर आवश्यक दस्तावेज:`,
    mr: `${scheme ? `**${scheme.name}** साठी` : ''} सामान्यतः आवश्यक कागदपत्रे:`,
    unknown: 'Documents typically required:',
  };

  return {
    sessionId: session.id,
    message: msgs[session.language] || msgs.en,
    type: 'documents',
    data: {
      documents: docs,
      note: 'Exact requirements may vary by Channel Partner. Verify before visiting.',
    },
    quickActions: [
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply?' },
    ],
    detectedLanguage: session.language,
    intent: 'document_requirements',
  };
}

async function handleSchemeComparison(session: Session): Promise<ChatApiResponse> {
  const recommended = (session.recommendedSchemes || []) as unknown as Scheme[];

  if (recommended.length < 2) {
    const all = await fetchActiveSchemes();
    const scored = scoreSchemes(all, session.entities).slice(0, 2);
    if (scored.length < 2) {
      return {
        sessionId: session.id,
        message: session.language === 'hi'
          ? 'तुलना के लिए कम से कम 2 योजनाएं होनी चाहिए। पहले ऋण योजना खोजें।'
          : 'Need at least 2 schemes to compare. Try finding a loan scheme first.',
        type: 'text',
        detectedLanguage: session.language,
        intent: 'scheme_comparison',
      };
    }
    session.recommendedSchemes = scored as unknown as Record<string, unknown>[];
    return handleSchemeComparison(session);
  }

  const [a, b] = recommended.slice(0, 2);

  return {
    sessionId: session.id,
    message: session.language === 'hi'
      ? `यहाँ **${a.name}** और **${b.name}** की तुलना है:`
      : session.language === 'mr'
        ? `येथे **${a.name}** आणि **${b.name}** यांची तुलना आहे:`
        : `Here's a comparison between **${a.name}** and **${b.name}**:`,
    type: 'comparison',
    data: { schemeA: a, schemeB: b },
    quickActions: [
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for the first scheme' },
      { label: 'Find partners', labelHi: 'पार्टनर खोजें', message: 'Where can I apply?' },
    ],
    detectedLanguage: session.language,
    intent: 'scheme_comparison',
  };
}

async function handleEligibility(session: Session): Promise<ChatApiResponse> {
  // Re-run recommendation with current entities
  const schemes = await recommendSchemes(session.entities);
  if (schemes.length === 0) {
    const msg = await llmReply('The user asked about eligibility but no schemes match their profile. Explain kindly.', session.language, 256);
    return { sessionId: session.id, message: msg, type: 'text', detectedLanguage: session.language, intent: 'scheme_eligibility' };
  }

  const top = schemes[0];
  const reasons = top.matchReasons.join('\n• ');
  const warns = top.warnings.length > 0 ? '\n\n⚠️ Note:\n• ' + top.warnings.join('\n• ') : '';

  const prompt = `
Scheme: ${top.name}
User: income=${session.entities.family_income_rs || 'unknown'}, purpose=${session.entities.purpose || 'unknown'}, amount=${session.entities.loan_amount_rs || 'unknown'}
Match reasons: ${reasons}
${warns}

Write 2–3 sentences on why the user appears eligible for this scheme. Use only the provided info. Always end with "Final eligibility will be confirmed by the Channel Partner."
  `.trim();

  const message = await llmReply(prompt, session.language, 320);

  return {
    sessionId: session.id,
    message,
    type: 'schemes',
    data: { schemes: schemes.slice(0, 1) },
    disclaimer: DISCLAIMER[session.language],
    quickActions: [
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for this scheme' },
      { label: 'Documents needed', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
    ],
    detectedLanguage: session.language,
    intent: 'scheme_eligibility',
  };
}

async function handleApplicationGuidance(session: Session): Promise<ChatApiResponse> {
  const prompt = `
Explain in simple terms how to apply for an NSFDC SC beneficiary loan scheme in India.
Steps: 1) Choose scheme 2) Find nearby Channel Partner (SCA/PSB/RRB) 3) Visit with documents 4) Fill application 5) Bank processes 6) Disbursement.
Keep it simple, 5–6 sentences.
  `.trim();
  const message = await llmReply(prompt, session.language, 384);
  return {
    sessionId: session.id,
    message,
    type: 'text',
    quickActions: [
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Find the nearest partner to apply' },
      { label: 'Documents needed', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
    ],
    detectedLanguage: session.language,
    intent: 'application_guidance',
  };
}

async function handleFallback(session: Session): Promise<ChatApiResponse> {
  const qs: Record<Language, string> = {
    en: "I'd be happy to help! Are you looking for:\n\n1️⃣ A loan scheme recommendation\n2️⃣ Education loan information\n3️⃣ EMI calculation\n4️⃣ Nearest Channel Partner\n5️⃣ Documents required",
    hi: "मैं मदद करने के लिए खुश हूँगा! क्या आप ढूंढ रहे हैं:\n\n1️⃣ ऋण योजना की सिफारिश\n2️⃣ शिक्षा ऋण जानकारी\n3️⃣ EMI गणना\n4️⃣ नजदीकी चैनल पार्टनर\n5️⃣ आवश्यक दस्तावेज",
    mr: "मी मदत करण्यास आनंदी आहे! तुम्ही शोधत आहात:\n\n1️⃣ कर्ज योजनेची शिफारस\n2️⃣ शिक्षण कर्ज माहिती\n3️⃣ EMI गणना\n4️⃣ जवळचे चॅनेल पार्टनर\n5️⃣ आवश्यक कागदपत्रे",
    unknown: "I'm happy to help! Are you looking for a loan recommendation, EMI calculation, or partner information?",
  };

  return {
    sessionId: session.id,
    message: qs[session.language] || qs.en,
    type: 'question',
    quickActions: [
      { label: 'Find a loan scheme', labelHi: 'ऋण योजना', message: 'I need a loan for my business' },
      { label: 'Education loan', labelHi: 'शिक्षा ऋण', message: 'I need an education loan' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for ₹2 lakh at 7% for 5 years' },
      { label: 'Find partner', labelHi: 'पार्टनर खोजें', message: 'Find nearest partner in Delhi' },
    ],
    detectedLanguage: session.language,
    intent: 'fallback',
  };
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function process(message: string, sessionId?: string): Promise<ChatApiResponse> {
  const session = getOrCreate(sessionId);

  // Detect language from current message if not yet set
  const lang = detectLanguage(message);
  if (session.language === 'unknown' && lang !== 'unknown') {
    session.language = lang;
  }

  // Classify intent
  const { intent, confidence } = classifyIntent(message);

  // Extract entities (LLM call — compact)
  const entities = await extractEntities(message);
  mergeEntities(session, entities);

  // Update conversation history
  session.conversationHistory.push({ role: 'user', content: message });
  session.lastIntent = intent;

  let response: ChatApiResponse;

  if (confidence < 0.55 && intent === 'fallback') {
    response = await handleFallback(session);
  } else {
    switch (intent) {
      case 'greeting':
        response = await handleGreeting(session);
        break;
      case 'emi_calculation':
        response = await handleEMICalculation(session);
        break;
      case 'education_loan':
        response = await handleSchemeRecommendation(session, 'education_loan');
        break;
      case 'business_loan':
        response = await handleSchemeRecommendation(session, 'micro_finance');
        break;
      case 'scheme_recommendation':
      case 'scheme_eligibility':
        response = intent === 'scheme_eligibility'
          ? await handleEligibility(session)
          : await handleSchemeRecommendation(session);
        break;
      case 'scheme_comparison':
        response = await handleSchemeComparison(session);
        break;
      case 'document_requirements':
        response = await handleDocumentRequirements(session);
        break;
      case 'partner_locator':
      case 'partner_routing':
        response = await handlePartnerLocator(session);
        break;
      case 'application_guidance':
        response = await handleApplicationGuidance(session);
        break;
      default:
        response = await handleFallback(session);
    }
  }

  // Save assistant message to history
  session.conversationHistory.push({ role: 'assistant', content: response.message });
  updateSession(session);

  return { ...response, sessionId: session.id };
}
