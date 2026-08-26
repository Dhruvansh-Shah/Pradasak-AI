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
  message: string;
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
  en: 'Official NSFDC Concessional Scheme Guidelines. Final eligibility and sanction are subject to document verification by the authorized Channel Partner.',
  hi: 'आधिकारिक NSFDC रियायती योजना दिशानिर्देश। अंतिम पात्रता और ऋण स्वीकृति अधिकृत चैनल पार्टनर द्वारा दस्तावेज सत्यापन के अधीन है।',
  mr: 'अधिकृत NSFDC सवलत योजना मार्गदर्शक तत्त्वे. अंतिम पात्रता आणि कर्ज मंजुरी अधिकृत चॅनेल भागीदाराद्वारे कागदपत्र पडताळणीच्या अधीन आहे.',
  unknown: 'Official NSFDC Concessional Scheme Guidelines.',
};

// ── LLM response generator ────────────────────────────────────────────────────

async function llmReply(
  prompt: string,
  language: Language,
  userGoalContext?: string,
  maxTokens = 1024
): Promise<string> {
  const langInstr =
    language === 'hi'
      ? 'Respond fluently and warmly in Hindi (Devanagari script).'
      : language === 'mr'
      ? 'Respond fluently and warmly in Marathi (Devanagari script).'
      : 'Respond in professional, warm, and conversational English.';

  const systemPrompt = `You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India).
Your goal is to help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, and connect with channel partners.

Key Guidelines:
1. Warmth & Encouragement: If the user shares a business idea or educational aspiration, warmly acknowledge and encourage their ambition.
2. Accuracy & Grounding: Use ONLY the exact numbers, interest rates, and loan limits provided in the prompt. Never invent scheme parameters.
3. No Fake Assumptions: If the user has not logged in or provided their income/amount, DO NOT say "Based on your profile" or "You are eligible". Instead, say "Based on your requirement..." or "For this purpose...".
4. Interactive Counter-Questions: If key details (loan amount needed, annual family income, or city/location) are missing, ask friendly follow-up questions to help narrow down the exact eligibility.
5. ${langInstr}`.trim();

  return llmCall({
    systemPrompt,
    userMessage: prompt,
    maxTokens,
  });
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handleGreeting(session: Session): Promise<ChatApiResponse> {
  const msgs: Record<Language, string> = {
    en: "Namaste! I am your Pradarshak AI Advisor for NSFDC concessional loans. I can help you with:\n\n• Finding the right loan scheme for your business or education\n• Calculating subsidized EMIs with moratorium support\n• Locating authorized Channel Partners (SCAs, RRBs, Banks) near you\n• Explaining eligibility rules & document requirements\n\nTell me about your business idea, study plan, or required loan amount to get started!",
    hi: "नमस्ते! मैं NSFDC रियायती ऋणों के लिए आपका प्रदर्शक AI सलाहकार हूँ। मैं आपकी सहायता कर सकता हूँ:\n\n• आपके व्यवसाय या उच्च शिक्षा के लिए सही ऋण योजना खोजने में\n• मोरेटोरियम (छूट अवधि) के साथ सब्सिडी युक्त EMI की गणना में\n• आपके निकटतम अधिकृत चैनल पार्टनर (राज्य एजेंसी, ग्रामीण बैंक) खोजने में\n• पात्रता नियमों और आवश्यक दस्तावेजों की जानकारी देने में\n\nशुरुआत करने के लिए अपने व्यावसायिक विचार, शिक्षा योजना या आवश्यक ऋण राशि के बारे में बताएं!",
    mr: "नमस्कार! मी NSFDC सवलतीच्या कर्जांसाठी तुमचा प्रदर्शक AI सल्लागार आहे. मी तुम्हाला पुढील बाबींमध्ये मदत करू शकतो:\n\n• तुमच्या व्यवसायासाठी किंवा उच्च शिक्षणासाठी योग्य कर्ज योजना शोधणे\n• मोरेटोरियम सवलतीसह सबसिडीयुक्त EMI मोजणे\n• तुमच्या जवळचे अधिकृत चॅनेल भागीदार (SCA, ग्रामीण बँक) शोधणे\n• पात्रता नियम आणि आवश्यक कागदपत्रांची माहिती मिळवणे\n\nसुरुवात करण्यासाठी तुमची व्यवसाय कल्पना किंवा शैक्षणिक उद्दिष्टाबद्दल सांगा!",
    unknown: "Namaste! I am your Pradarshak AI Advisor for NSFDC concessional loans. How can I assist your business or education venture today?",
  };

  return {
    sessionId: session.id,
    message: msgs[session.language] || msgs.en,
    type: 'text',
    quickActions: [
      { label: 'Business loan scheme', labelHi: 'व्यवसाय ऋण योजना', message: 'I want to start a business' },
      { label: 'Education loan', labelHi: 'शिक्षा ऋण', message: 'I need an education loan' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for ₹2 lakh at 5% for 3 years' },
      { label: 'Find nearest partner', labelHi: 'नजदीकी पार्टनर', message: 'Where is the nearest channel partner branch?' },
    ],
    detectedLanguage: session.language,
    intent: 'greeting',
  };
}

async function handleSchemeRecommendation(session: Session, categoryHint?: string): Promise<ChatApiResponse> {
  const { entities } = session;

  // If loan amount is high (> ₹2L), don't restrict to micro_finance
  const effectiveCategoryHint =
    categoryHint === 'micro_finance' && entities.loan_amount_rs && entities.loan_amount_rs > 200000
      ? undefined
      : categoryHint;

  // Run recommendation engine with entities
  const schemes = await recommendSchemes(entities, effectiveCategoryHint);

  // Save in session
  session.recommendedSchemes = schemes as unknown as Record<string, unknown>[];
  session.selectedScheme = (schemes[0] || {}) as unknown as Record<string, unknown>;

  const top = schemes[0] || {
    name: 'Term Loan (TL)',
    category: 'term_loan',
    interest_rate_min: 6,
    interest_rate_max: 8,
    max_loan_lakh: 27,
    max_income_lakh: 5,
    moratorium_months_min: 6,
    moratorium_months_max: 12,
    max_tenure_months: 120,
    coverage_percent: 90,
  };

  const hasIncome = Boolean(entities.family_income_rs);
  const hasAmount = Boolean(entities.loan_amount_rs);
  const hasLocation = Boolean(entities.location);

  const missingQuestions: string[] = [];
  if (!hasAmount) missingQuestions.push('estimated loan amount required');
  if (!hasIncome) missingQuestions.push('annual family income (standard NSFDC threshold is ≤ ₹5.00 Lakh/year)');
  if (!hasLocation) missingQuestions.push('your city or district to find your nearest partner branch');

  let partnerContext = '';
  if (hasLocation && entities.location) {
    const pt = await geocode(entities.location);
    if (pt) {
      const nearby = await findNearbyPartners(pt, top.category, 150, 2);
      if (nearby.length > 0) {
        partnerContext = `\nNearest Authorized Partner: ${nearby[0].name} (${nearby[0].partner_type}, ${nearby[0].city}, ~${nearby[0].distance_km} km away)`;
      }
    }
  }

  const prompt = `
User Inquiry: "${session.conversationHistory[session.conversationHistory.length - 1]?.content || 'Loan inquiry'}"
Recognized goal/purpose: ${entities.purpose || effectiveCategoryHint || 'Business venture / Enterprise'}
Known details: Loan required: ${entities.loan_amount_rs ? '₹' + entities.loan_amount_rs.toLocaleString('en-IN') : 'Not specified yet'}, Family income: ${entities.family_income_rs ? '₹' + entities.family_income_rs.toLocaleString('en-IN') + ' (₹' + (entities.family_income_rs/100000).toFixed(1) + ' Lakh/yr)' : 'Not specified yet'}, Location: ${entities.location || 'Not specified yet'}${partnerContext}

Top Matching Official Schemes:
1. ${top.name} (${top.category})
- Subsidized Interest Rate: ${top.interest_rate_min}%–${top.interest_rate_max}% p.a.
- Max Loan Limit: Up to ₹${(top.max_loan_lakh * 100000).toLocaleString('en-IN')} (₹${top.max_loan_lakh} Lakh)
- Official Income Threshold: ≤ ₹${top.max_income_lakh} Lakh/year
- Repayment Tenure: Up to ${top.max_tenure_months} months with ${top.moratorium_months_min}–${top.moratorium_months_max} months moratorium

Missing user parameters to ask (if any): ${missingQuestions.join(', ') || 'None'}

Instructions:
1. Warmly acknowledge and validate their venture, initiative, or goals.
2. Present the matching scheme (**${top.name}**) with its low subsidized interest rate (${top.interest_rate_min}%–${top.interest_rate_max}%) and loan terms.
3. If family income exceeds ₹5L, transparently explain that standard NSFDC concessional criteria target income up to ₹5.00 Lakh/yr, but they can still review the scheme parameters and consult the channel partner for eligibility or credit linkage.
4. ${missingQuestions.length > 0 ? `Politely ask 1-2 quick follow-up questions (${missingQuestions.slice(0, 2).join(' and ')}) to calculate exact EMIs and connect them to the branch.` : 'Guide them to calculate their subsidized EMI or locate their nearest partner branch.'}
5. Keep the tone inspiring, professional, and clear.
  `.trim();

  const explanation = await llmReply(prompt, session.language, entities.purpose || undefined, 450);

  return {
    sessionId: session.id,
    message: explanation,
    type: 'schemes',
    data: { schemes: schemes.slice(0, 3) },
    quickActions: [
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: `Calculate EMI for ${top.name}` },
      { label: 'Required documents', labelHi: 'दस्तावेज', message: `What documents do I need for ${top.name}?` },
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: entities.location ? `Where can I apply near ${entities.location}?` : 'Where can I apply near me?' },
      { label: 'Compare other schemes', labelHi: 'तुलना करें', message: 'Compare with other loan schemes' },
    ],
    disclaimer: DISCLAIMER[session.language],
    detectedLanguage: session.language,
    intent: 'scheme_recommendation',
  };
}

async function handleEMICalculation(session: Session): Promise<ChatApiResponse> {
  const { entities } = session;
  const scheme = session.selectedScheme as unknown as Scheme | undefined;

  const principal = Number(entities.loan_amount_rs) || (scheme ? Number(scheme.max_loan_lakh) * 100000 * 0.75 : 200000);
  const minRate = scheme ? Number(scheme.interest_rate_min) || 6 : 6;
  const maxRate = scheme ? Number(scheme.interest_rate_max) || minRate : 6;
  const rate = Number(entities.interest_rate_pct) || ((minRate + maxRate) / 2);
  const tenure = Number(entities.tenure_months) || (scheme ? Number(scheme.max_tenure_months) || 60 : 60);
  const moratorium = Number(entities.moratorium_months) || (scheme ? Number(scheme.moratorium_months_min) || 0 : 0);

  let effectivePrincipal = principal;
  if (moratorium > 0) {
    const r = rate / 100 / 12;
    for (let i = 0; i < moratorium; i++) effectivePrincipal *= (1 + r);
  }

  const emi = calcEMI(effectivePrincipal, rate, tenure);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - principal;

  const prompt = `
Explain the calculated repayment breakdown for the user:
- Scheme: ${scheme?.name || 'NSFDC Concessional Loan'}
- Loan Principal: ₹${principal.toLocaleString('en-IN')}
- Subsidized Interest: ${rate}% p.a.
- Tenure: ${tenure} months (${Math.round(tenure / 12)} years)
- Moratorium grace period: ${moratorium} months
- Monthly EMI: ₹${Math.round(emi).toLocaleString('en-IN')}
- Total Interest: ₹${Math.round(totalInterest).toLocaleString('en-IN')}
- Total Outflow: ₹${Math.round(totalPayable).toLocaleString('en-IN')}

Keep explanation to 2-3 clear sentences highlighting the affordable subsidized monthly installment.
  `.trim();

  const explanation = await llmReply(prompt, session.language, undefined, 300);

  return {
    sessionId: session.id,
    message: explanation,
    type: 'emi',
    data: {
      emi: Math.round(emi),
      totalPayable: Math.round(totalPayable),
      totalInterest: Math.round(totalInterest),
      params: { principal, rate, tenureMonths: tenure, moratoriumMonths: moratorium },
      schemeName: scheme?.name,
    },
    quickActions: [
      { label: 'Find partner to apply', labelHi: 'पार्टनर खोजें', message: 'Where can I apply for this loan?' },
      { label: 'Documents checklist', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
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
      en: "Which city or district are you located in? (e.g. Pune, Amravati, Nagpur, Delhi, Lucknow, Patna). I will locate your nearest authorized State Channelizing Agency (SCA) or Rural Bank branch.",
      hi: "आप किस शहर या जिले में स्थित हैं? (उदा. अमरावती, नागपुर, पुणे, दिल्ली, लखनऊ)। मैं आपकी निकटतम अधिकृत राज्य एजेंसी (SCA) या ग्रामीण बैंक शाखा खोजूँगा।",
      mr: "तुम्ही कोणत्या शहरात किंवा जिल्ह्यात आहात? (उदा. अमरावती, नागपूर, पुणे, मुंबई, नाशिक). मी तुमच्या जवळचे अधिकृत राज्य महामंडळ किंवा बँक शाखा शोधून देतो.",
      unknown: "Please tell me your city or district name to find nearby channel partners.",
    };
    return {
      sessionId: session.id,
      message: qs[session.language] || qs.en,
      type: 'question',
      quickActions: [
        { label: '📍 Amravati', labelHi: 'अमरावती', message: 'Find partners in Amravati' },
        { label: '📍 Nagpur', labelHi: 'नागपुर', message: 'Find partners in Nagpur' },
        { label: '📍 Pune', labelHi: 'पुणे', message: 'Find partners in Pune' },
        { label: '📍 Delhi NCR', labelHi: 'दिल्ली', message: 'Find partners in Delhi' },
      ],
      detectedLanguage: session.language,
      intent: 'partner_locator',
    };
  }

  const point = await geocode(entities.location);
  if (!point) {
    const msgs: Record<Language, string> = {
      en: `I couldn't identify the coordinates for "${entities.location}". Could you specify a major nearby district or state capital?`,
      hi: `मैं "${entities.location}" का स्थान नहीं खोज पाया। क्या आप नजदीकी प्रमुख जिले या शहर का नाम बता सकते हैं?`,
      mr: `मला "${entities.location}" चे स्थान सापडले नाही. कृपया जवळील प्रमुख शहर किंवा जिल्ह्याचे नाव सांगा.`,
      unknown: `Could not locate "${entities.location}". Please name a nearby district.`,
    };
    return {
      sessionId: session.id,
      message: msgs[session.language] || msgs.en,
      type: 'question',
      detectedLanguage: session.language,
      intent: 'partner_locator',
    };
  }

  const partners = await findNearbyPartners(point, scheme?.category, 150, 4);

  const prompt = `
Location search: ${entities.location}
Partners found: ${partners.length} authorized channel partners
Top partner: ${partners[0]?.name || 'State Agency'} (${partners[0]?.partner_type}, ${partners[0]?.city}, ${partners[0]?.distance_km || 5} km away)

Write 2 friendly sentences explaining that verified channel partners were located near ${entities.location} where the beneficiary can submit documents.
  `.trim();

  const explanation = await llmReply(prompt, session.language, undefined, 1024);

  return {
    sessionId: session.id,
    message: explanation,
    type: 'partners',
    data: { partners, location: entities.location },
    quickActions: [
      { label: 'Required documents', labelHi: 'दस्तावेज', message: 'What documents should I carry to the partner?' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI' },
    ],
    detectedLanguage: session.language,
    intent: 'partner_locator',
  };
}

async function handleDocumentRequirements(session: Session, userMsg?: string): Promise<ChatApiResponse> {
  let scheme = session.selectedScheme as unknown as Scheme | undefined;

  if (userMsg) {
    const allSchemes = await fetchActiveSchemes();
    const found = allSchemes.find(
      (s) =>
        userMsg.toLowerCase().includes(s.name.toLowerCase()) ||
        (s.short_name && userMsg.toLowerCase().includes(s.short_name.toLowerCase()))
    );
    if (found) {
      scheme = found;
      session.selectedScheme = found as unknown as Record<string, unknown>;
    }
  }

  const isEdu = scheme?.category === 'education_loan' || userMsg?.toLowerCase().includes('education');

  const docs = [
    'Aadhaar Card (Identity & Address Proof)',
    'Valid SC Caste Certificate issued by Competent Authority',
    'Income Certificate (Family annual income ≤ ₹5.00 Lakh)',
    'Bank Account Passbook / Statement (Aadhaar linked)',
    'Recent Passport-size Photographs (2 copies)',
    isEdu
      ? 'Admission Letter & Fee Structure from Recognized College/University'
      : 'Project Report / Business Quotation for Machinery or Working Capital',
  ];

  const schemeTitle = scheme ? scheme.name : isEdu ? 'the Education Loan Scheme (ELS)' : 'an NSFDC concessional loan scheme';
  const note = 'Original certificates must be presented for in-person verification at the Channel Partner branch.';

  const prompt = `
Explain the essential documents required for applying to ${schemeTitle}. Keep it to 2 clear, encouraging sentences explaining what the applicant should carry.
  `.trim();

  const message = await llmReply(prompt, session.language, undefined, 1024);

  return {
    sessionId: session.id,
    message,
    type: 'documents',
    data: { documents: docs, note },
    quickActions: [
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Find the nearest partner to submit documents' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: `Calculate EMI for ${schemeTitle}` },
    ],
    detectedLanguage: session.language,
    intent: 'document_requirements',
  };
}

async function handleSchemeComparison(session: Session): Promise<ChatApiResponse> {
  const schemes = await fetchActiveSchemes();
  const schemeA = schemes[0];
  const schemeB = schemes[1] || schemes[0];

  return {
    sessionId: session.id,
    message: `Here is a side-by-side comparison of **${schemeA.name}** and **${schemeB.name}**:`,
    type: 'comparison',
    data: { schemeA, schemeB },
    quickActions: [
      { label: `Choose ${schemeA.name}`, labelHi: schemeA.name, message: `Tell me more about ${schemeA.name}` },
      { label: `Choose ${schemeB.name}`, labelHi: schemeB.name, message: `Tell me more about ${schemeB.name}` },
    ],
    detectedLanguage: session.language,
    intent: 'scheme_comparison',
  };
}

async function handleEligibility(session: Session): Promise<ChatApiResponse> {
  return handleSchemeRecommendation(session);
}

async function handleApplicationGuidance(session: Session): Promise<ChatApiResponse> {
  const prompt = `
Explain the simple 4-step process to apply for an NSFDC concessional loan in India:
1. Select the right scheme matching your enterprise or study.
2. Prepare required proofs (SC Certificate, Income proof ≤ ₹5L, Project Report/Admission).
3. Visit the nearest Channel Partner (State SC Corporation, RRB, or Nationalised Bank).
4. Complete loan processing & direct benefit transfer.
Keep it warm and concise (4-5 sentences).
  `.trim();

  const message = await llmReply(prompt, session.language, undefined, 350);

  return {
    sessionId: session.id,
    message,
    type: 'text',
    quickActions: [
      { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Find the nearest partner to apply' },
      { label: 'Documents checklist', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
    ],
    detectedLanguage: session.language,
    intent: 'application_guidance',
  };
}

async function handleFallback(session: Session): Promise<ChatApiResponse> {
  // If we already have any entities (loan amount, purpose, or location), auto-route to scheme recommendation
  if (session.entities.loan_amount_rs || session.entities.purpose || session.entities.location) {
    return handleSchemeRecommendation(session);
  }

  const lastUserMsg = session.conversationHistory[session.conversationHistory.length - 1]?.content || '';
  
  const prompt = `
The user asked: "${lastUserMsg}"
Known details so far: ${JSON.stringify(session.entities)}
You are the NSFDC Financial Assistant. Respond warmly, acknowledge their venture/inquiry, and explain how NSFDC concessional loans and subsidized interest rates (4%-8%) can help them. Ask for their required loan amount or business activity to find the best matching scheme.
  `.trim();

  const message = await llmReply(prompt, session.language, undefined, 350);

  return {
    sessionId: session.id,
    message,
    type: 'text',
    quickActions: [
      { label: 'Explore loan schemes', labelHi: 'ऋण योजनाएं', message: 'What loan schemes are available?' },
      { label: 'Education loan', labelHi: 'शिक्षा ऋण', message: 'I need an education loan' },
      { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI' },
      { label: 'Find channel partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply near me?' },
    ],
    detectedLanguage: session.language,
    intent: 'fallback',
  };
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function process(message: string, sessionId?: string): Promise<ChatApiResponse> {
  const session = getOrCreate(sessionId);

  // Detect language
  const lang = detectLanguage(message);
  if (session.language === 'unknown' && lang !== 'unknown') {
    session.language = lang;
  }

  // Update conversation history
  session.conversationHistory.push({ role: 'user', content: message });

  // Extract entities via Gemini with multi-turn conversation context
  const entities = await extractEntities(message, session.conversationHistory);
  mergeEntities(session, entities);

  // Classify intent with session context
  const { intent, confidence } = classifyIntent(message, {
    lastIntent: session.lastIntent,
    hasEntities: Object.keys(session.entities).length > 0,
  });
  session.lastIntent = intent;

  let response: ChatApiResponse;

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
    case 'scheme_recommendation':
    case 'scheme_eligibility':
      response = await handleSchemeRecommendation(session);
      break;
    case 'scheme_comparison':
      response = await handleSchemeComparison(session);
      break;
    case 'document_requirements':
      response = await handleDocumentRequirements(session, message);
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

  // Save assistant message to history
  session.conversationHistory.push({ role: 'assistant', content: response.message });
  updateSession(session);

  return { ...response, sessionId: session.id };
}
