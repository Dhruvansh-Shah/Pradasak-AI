import { detectLanguage } from './IntentClassifier';
import type { Language } from './IntentClassifier';
import { getOrCreate, updateSession, extractAndUpdateFacts } from './ConversationSession';
import type { Session, UserProfileContext, ConversationFacts } from './ConversationSession';
import { TOOL_DEFS, executeTool } from './Tools';
import { fetchSchemeById, fetchSchemeByName, fetchActiveSchemes, normalizeSchemeText } from './SchemeEngine';
import type { Scheme } from './SchemeEngine';
import { llmChat } from '../lib/openrouter';
import type { ChatMessage } from '../lib/openrouter';
import { getLanguageConfig } from '../config/languages';
import { resolveEffectiveLanguage } from './LanguageResolver';

/**
 * ChatOrchestrator.ts
 * ------------------------------------------------------------------
 * One merged LLM conversation per turn. There is no separate
 * "understand the message" call and "explain the grounded result" call
 * anymore — a single agentic loop handles both:
 *
 *   1. The model reads the full conversation and either:
 *      a) answers directly / asks a clarifying question (no tool call), or
 *      b) calls one of the real tools in Tools.ts (recommend_schemes,
 *         calculate_emi, find_partners, get_required_documents,
 *         compare_schemes) with the parameters it has understood.
 *   2. If it called a tool, we execute the real deterministic/DB logic,
 *      hand the real result back to the model, and let it write the
 *      final natural-language explanation grounded in that real data.
 *
 * This keeps the "never invent scheme numbers" guarantee (the model only
 * ever explains data our own code fetched/computed) while removing all
 * keyword-based intent classification and regex-based entity extraction.
 */

// ── Response types ────────────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  labelHi: string;
  message: string;
}

export interface ChatApiResponse {
  sessionId: string;
  message: string;
  speechText?: string;
  type: 'text' | 'schemes' | 'emi' | 'partners' | 'comparison' | 'documents' | 'question';
  data?: Record<string, unknown>;
  quickActions?: QuickAction[];
  disclaimer?: string;
  detectedLanguage: string;
  intent: string;
}


export const POST_RECOMMENDATION_CTA: Record<string, string> = {
  en: "Tell me if you'd like more details about a scheme, the required documents, an EMI estimate, or the nearest channel partner.",
  hi: "यदि आप किसी योजना के बारे में अधिक विवरण, आवश्यक दस्तावेज, ईएमआई अनुमान, या निकटतम चैनल पार्टनर की जानकारी चाहते हैं, तो कृपया मुझे बताएं।",
  mr: "तुम्हाला एखाद्या योजनेबद्दल अधिक तपशील, आवश्यक कागदपत्रे, ईएमआय अंदाज किंवा जवळच्या चॅनेल भागीदाराची माहिती हवी असल्यास मला सांगा.",
  bn: "আপনি যদি কোনো প্রকল্পের বিস্তারিত, প্রয়োজনীয় নথিপত্র, ইএমআই অনুমান বা নিকটবর্তী চ্যানেল পার্টনার সম্পর্কে জানতে চান তবে আমাকে বলুন।",
  gu: "જો તમે કોઈ યોજના વિશે વધુ વિગતો, જરૂરી દસ્તાવેજો, EMI અંદાજ અથવા નજીકના ચેનલ પાર્ટનરની માહિતી મેળવવા માંગતા હોવ, તો કૃપા કરીને મને જણાવો.",
  kn: "ಯಾವುದೇ ಯೋಜನೆಯ ಹೆಚ್ಚಿನ ವಿವರಗಳು, ಅಗತ್ಯ ದಾಖಲೆಗಳು, ಇಎಂಐ ಅಂದಾಜು ಅಥವಾ ಹತ್ತಿರದ ಚಾನಲ್ ಪಾಲುದಾರರ ಮಾಹಿತಿ ಬೇಕಾಗಿದ್ದರೆ ನನಗೆ ತಿಳಿಸಿ.",
  ml: "ഏതെങ്കിലും പദ്ധതിയെക്കുറിച്ചുള്ള കൂടുതൽ വിവരങ്ങൾ, ആവശ്യമായ രേഖകൾ, ഇഎംഐ കണക്കുകൂട്ടൽ, അല്ലെങ്കിൽ അടുത്തുള്ള ചാനൽ പങ്കാളിയെക്കുറിച്ച് അറിയാൻ താൽപ്പര്യമുണ്ടെങ്കിൽ എന്നോട് പറയുക.",
  od: "ଯଦି ଆପଣ କୌଣସି ଯୋଜନା ବିଷୟରେ ଅଧିକ ବିବରଣୀ, ଆବଶ୍ୟକୀୟ ଦସ୍ତାବିଜ, EMI ଅନୁମାନ କିମ୍ବା ନିକଟତମ ଚ୍ୟାନେଲ ପାର୍ଟନର ବିଷୟରେ ଜାଣିବାକୁ ଚାହାଁନ୍ତି, ତେବେ ମୋତେ ଜଣାନ୍ତୁ।",
  pa: "ਜੇਕਰ ਤੁਸੀਂ ਕਿਸੇ ਸਕੀਮ ਬਾਰੇ ਹੋਰ ਵੇਰਵੇ, ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼, EMI ਅਨੁਮਾਨ, ਜਾਂ ਨਜ਼ਦੀਕੀ ਚੈਨਲ ਪਾਰਟਨਰ ਬਾਰੇ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਤਾਂ ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਦੱਸੋ।",
  ta: "ஒரு திட்டம் பற்றிய கூடுதல் விவரங்கள், தேவையான ஆவணங்கள், இஎம்ஐ மதிப்பீடு அல்லது அருகிலுள்ள சேனல் கூட்டாளர் பற்றி அறிய விரும்பினால் என்னிடம் கூறுங்கள்.",
  te: "ఏదైనా పథకం గురించి మరిన్ని వివరాలు, అవసరమైన పత్రాలు, EMI అంచనా లేదా సమీపంలోని ఛానెల్ భాగస్వామి గురించి తెలుసుకోవాలనుకుంటే నాకు చెప్పండి.",
};

const DISCLAIMER: Record<string, string> = {
  en: 'Official NSFDC Concessional Scheme Guidelines. Final eligibility and sanction are subject to document verification by the authorized Channel Partner.',
  hi: 'आधिकारिक NSFDC रियायती योजना दिशानिर्देश। अंतिम पात्रता और ऋण स्वीकृति अधिकृत चैनल पार्टनर द्वारा दस्तावेज सत्यापन के अधीन है।',
  mr: 'अधिकृत NSFDC सवलत योजना मार्गदर्शक तत्त्वे. अंतिम पात्रता आणि कर्ज मंजुरी अधिकृत चॅनेल भागीदाराद्वारे कागदपत्र पडताळणीच्या अधीन आहे.',
  bn: 'অফিসিয়াল এনএসএফডিসি কনসেশনাল স্কিম নির্দেশিকা। চূড়ান্ত যোগ্যতা এবং অনুমোদন অনুমোদিত চ্যানেল পার্টনার দ্বারা নথি যাচাইকরণ সাপেক্ষ।',
  gu: 'સત્તાવાર NSFDC રાહત યોજના માર્ગદર્શિકા. અંતિમ પાત્રતા અને લોન મંજૂરી અધિકૃત ચેનલ પાર્ટનર દ્વારા દસ્તાવેજ ચકાસણીને આધીન છે.',
  kn: 'ಅಧಿಕೃತ ಎನ್ಎಸ್ಎಫ್ಡಿಸಿ ರಿಯಾಯಿತಿ ಯೋಜನೆ ಮಾರ್ಗಸೂಚಿಗಳು. ಅಂತಿಮ ಅರ್ಹತೆ ಮತ್ತು ಸಾಲ ಮಂಜೂರಾತಿ ಅಧಿಕೃತ ಚಾನಲ್ ಪಾಲುದಾರರಿಂದ ದಾಖಲೆ ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.',
  ml: 'ഔദ്യോഗിക എൻ‌എസ്‌എഫ്‌ഡി‌സി ഇളവ് പദ്ധതി മാർഗ്ഗനിർദ്ദേശങ്ങൾ. അന്തിമ യോഗ്യതയും വായ്പ അനുമതിയും അംഗീകൃത ചാനൽ പങ്കാളിയുടെ രേഖ പരിശോധനയ്ക്ക് വിധേയമാണ്.',
  od: 'ଅଫିସିଆଲ୍ NSFDC ରିହାତି ଯୋଜନା ନିର୍ଦ୍ଦେଶାବଳୀ। ଚୂଡ଼ାନ୍ତ ଯୋଗ୍ୟତା ଏବଂ ମଞ୍ଜୁରୀ ପ୍ରାଧିକୃତ ଚ୍ୟାନେଲ ପାର୍ଟନରଙ୍କ ଦ୍ୱାରା ଦସ୍ତାବିଜ ଯାଞ୍ଚ ସାପେକ୍ଷ।',
  pa: 'ਅਧਿਕਾਰਤ NSFDC ਰਿਆਇਤੀ ਸਕੀਮ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼। ਅੰਤਿਮ ਯੋਗਤਾ ਅਤੇ ਪ੍ਰਵਾਨਗੀ ਅਧਿਕਾਰਤ ਚੈਨਲ ਪਾਰਟਨਰ ਦੁਆਰਾ ਦਸਤਾਵੇਜ਼ ਤਸਦੀਕ ਦੇ ਅਧੀਨ ਹੈ।',
  ta: 'அதிகாரப்பூர்வ NSFDC சலுகை திட்ட வழிகாட்டுதல்கள். இறுதி தகுதி மற்றும் ஒப்புதல் அங்கீகரிக்கப்பட்ட சேனல் கூட்டாளரின் ஆவண சரிபார்ப்புக்கு உட்பட்டது.',
  te: 'అధికారిక NSFDC రాయితీ పథకం మార్గదర్శకాలు. తుది అర్హత మరియు రుణం మంజూరు అధీకృత ఛానెల్ భాగస్వామి ద్వారా పత్రాల ధృవీకరణకు లోబడి ఉంటుంది.',
};

const QUICK_ACTIONS: Record<ChatApiResponse['type'], QuickAction[]> = {
  schemes: [
    { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate the EMI for this' },
    { label: 'Required documents', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
    { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply near me?' },
    { label: 'Compare other schemes', labelHi: 'तुलना करें', message: 'Compare with other loan schemes' },
  ],
  emi: [
    { label: 'Find partner to apply', labelHi: 'पार्टनर खोजें', message: 'Where can I apply for this loan?' },
    { label: 'Documents checklist', labelHi: 'दस्तावेज', message: 'What documents do I need?' },
  ],
  partners: [
    { label: 'Required documents', labelHi: 'दस्तावेज', message: 'What documents should I carry to the partner?' },
    { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI' },
  ],
  documents: [
    { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Find the nearest partner to submit documents' },
    { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for this scheme' },
  ],
  comparison: [
    { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI for the first scheme' },
    { label: 'Find nearest partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply near me?' },
  ],
  text: [
    { label: 'Explore loan schemes', labelHi: 'ऋण योजनाएं', message: 'What loan schemes are available?' },
    { label: 'Education loan', labelHi: 'शिक्षा ऋण', message: 'I need an education loan' },
    { label: 'Calculate EMI', labelHi: 'EMI गणना', message: 'Calculate EMI' },
    { label: 'Find channel partner', labelHi: 'पार्टनर खोजें', message: 'Where can I apply near me?' },
  ],
  question: [],
};

// ── System prompt ──────────────────────────────────────────────────────────────

function getCategoryInfo(category: string): { name: string; altName: string } | null {
  if (category === 'education') {
    return { name: 'Education Loan', altName: 'Business Loan' };
  }
  if (category === 'small-business') {
    return { name: 'Business / Entrepreneurship Loan', altName: 'Education Loan' };
  }
  if (category === 'women-exclusive') {
    return { name: 'Mahila Samriddhi Yojana (Women Exclusive)', altName: 'General Business or Education Loan' };
  }
  if (category === 'emi-calculation') {
    return { name: 'EMI Repayment Calculation', altName: 'General Scheme Search' };
  }
  return null;
}

export function buildSystemPrompt(
  langCode: string,
  category?: string,
  userContext?: UserProfileContext,
  knownFacts?: ConversationFacts
): string {
  const cfg = getLanguageConfig(langCode);
  const langName = cfg ? cfg.name : 'English';

  const antiEnglishRule =
    langCode !== 'en'
      ? '- Do NOT randomly switch the entire response to English simply because English words or technical terms appear in the user\'s prompt.'
      : '- Respond strictly in English. Do NOT switch to any other language unless explicitly requested.';

  const catInfo = category ? getCategoryInfo(category) : null;
  const categoryMismatchRule = catInfo
    ? `
SELECTED CARD CATEGORY CONTEXT & MISMATCH ACKNOWLEDGMENT:
- User selected card category: "${catInfo.name}".
- CATEGORY MISMATCH RULE:
  * If the user's current query CLEARLY and OBVIOUSLY belongs to a different category (for example: user selected "${catInfo.name}", but explicitly asks for a ${catInfo.altName} or another unrelated category):
    - Do NOT call any tools or search schemes for the mismatched category.
    - Do NOT automatically switch categories.
    - Do NOT execute the new category query.
    - Respond ONLY with a short, polite clarification in ${langName} (${langCode}) acknowledging the mismatch (e.g. "It looks like you're looking for a ${catInfo.altName} rather than a ${catInfo.name}. Would you like me to help you with ${catInfo.altName} schemes?").
  * If the query MATCHES "${catInfo.name}" OR is ambiguous/general, proceed normally.
`
    : '';

  const salaryNum = userContext?.salary != null ? Number(userContext.salary) : null;
  const userProfileLines: string[] = [];
  if (userContext?.name) userProfileLines.push(`- Beneficiary Name: ${userContext.name}`);
  if (userContext?.caste_category) userProfileLines.push(`- Verified Social / Caste Category: ${userContext.caste_category} (Statutorily Eligible for NSFDC programs)`);
  if (salaryNum != null) userProfileLines.push(`- Verified Annual Family Income: ₹${salaryNum.toLocaleString('en-IN')} (verified from official records; ceiling ≤ ₹5,00,000)`);
  if (userContext?.city || userContext?.district || userContext?.state) {
    const loc = [userContext.city, userContext.district, userContext.state].filter(Boolean).join(', ');
    userProfileLines.push(`- Verified Residential Location: ${loc}`);
  }
  if (userContext?.gender) userProfileLines.push(`- Gender: ${userContext.gender}`);
  if (userContext?.education_level) userProfileLines.push(`- Education Level: ${userContext.education_level}`);
  if (userContext?.trade_category) userProfileLines.push(`- Registered Trade / Venture Category: ${userContext.trade_category}`);
  if (userContext?.funding_bracket) userProfileLines.push(`- Target Funding Bracket: ${userContext.funding_bracket}`);

  const verifiedLocation = userContext?.district || userContext?.city || '';

  const userInfoPrompt = userProfileLines.length > 0
    ? `
AUTHENTICATED BENEFICIARY PROFILE & PRE-VERIFIED GROUND TRUTH:
${userProfileLines.join('\n')}

CRITICAL ZERO-REDUNDANCY DIRECTIVES:
- The beneficiary's profile is PRE-VERIFIED. NEVER ask the user what their salary, income, location, city, district, gender, education, or business trade is!
${salaryNum != null ? `- Verified Annual Income is ₹${salaryNum.toLocaleString('en-IN')}. Automatically use this figure when checking scheme eligibility (ceiling ≤ ₹5,00,000) or evaluating repayment capacity.` : ''}
${verifiedLocation ? `- Verified Location is ${verifiedLocation}. When the user asks "Where is the nearest branch?", "find partners", or "where to apply", NEVER prompt for their city/location — IMMEDIATELY call find_partners with location: "${verifiedLocation}".` : ''}
${userContext?.trade_category ? `- Target Trade is "${userContext.trade_category}". Automatically recommend schemes matching this trade.` : ''}
`
    : '';

  const factLines: string[] = [];
  if (knownFacts) {
    if (knownFacts.business_type) factLines.push(`- Stated Business / Trade: ${knownFacts.business_type}`);
    if (knownFacts.purpose) factLines.push(`- Stated Purpose / Equipment: ${knownFacts.purpose}`);
    if (knownFacts.loan_amount_rs != null) {
      factLines.push(`- Stated Loan Requirement: ₹${(knownFacts.loan_amount_rs / 100000).toFixed(1)} Lakh (₹${knownFacts.loan_amount_rs.toLocaleString('en-IN')}) [${knownFacts.loan_amount_type || 'approximate'}]`);
    }
    if (knownFacts.family_income_rs != null) {
      factLines.push(`- Stated Annual Family Income: ₹${knownFacts.family_income_rs.toLocaleString('en-IN')}`);
    }
    if (knownFacts.location) factLines.push(`- Stated Location: ${knownFacts.location}`);
    if (knownFacts.last_recommended_schemes && knownFacts.last_recommended_schemes.length > 0) {
      factLines.push(`- Previously Presented Schemes: ${knownFacts.last_recommended_schemes.map((s) => s.name).join(', ')}`);
    }
  }

  const knownFactsPrompt = factLines.length > 0
    ? `
STRUCTURED CONVERSATION CONTEXT & KNOWN BENEFICIARY FACTS (DO NOT RE-ASK):
${factLines.join('\n')}

CONVERSATIONAL INTEGRITY & ZERO-REDUNDANCY MANDATE:
- DO NOT re-ask the user for any information that is already present in the KNOWN FACTS or pre-verified profile above!
- Specifically:
  * If the loan amount is already known (e.g. ₹1 Lakh), NEVER ask "What loan amount do you need?" or "Could you share your required loan amount?".
  * If the business type is already known (e.g. tailoring), NEVER ask "What business are you planning?".
  * NEVER ask about an "intended course" or "degree" unless the user's inquiry is explicitly an education loan. For a tailoring business, discuss machines, shop setup, and working capital, NEVER courses.
- FINANCING ESTIMATION INQUIRIES:
  * If the user asks "how much money do I need actually" or asks for an estimate for their tailoring business, explain that ₹1 Lakh is a realistic starting estimate covering an industrial sewing machine, shop security/furnishing, and fabric working capital.
  * Highlight that Micro Credit Finance (MCF) supports small projects up to ₹1.40 Lakh at 6.5% interest, making it an ideal match.
- STANDARDIZED POST-RECOMMENDATION CTA:
  * Whenever you present or recommend schemes to the user, conclude your response with this exact offer:
    "${POST_RECOMMENDATION_CTA[langCode] || POST_RECOMMENDATION_CTA.en}"
  * This offer MUST appear strictly AFTER the scheme recommendations, never before them.
`
    : '';

  return `
You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India). You help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, find channel partners, and understand documentation and application steps.
${userInfoPrompt}
${knownFactsPrompt}
USER'S EFFECTIVE RESPONSE LANGUAGE:
- Effective response language: ${langName} (${langCode}).
- You MUST respond naturally in ${langName}.
${antiEnglishRule}
${categoryMismatchRule}
NATURAL INDIAN CODE-MIXING & TONE:
- If the user writes in code-mixed language (e.g. Hinglish or mixed English with Indian terms like 'engineering', 'education loan', 'Aadhaar', 'NSFDC', 'EMI', 'college', 'PMFME'), maintain a natural conversational style.
- Keep common technical, educational, financial terms, scheme names, and acronyms in English/standard form when natural.
- Do NOT use archaic, unnatural, or overly formal translations simply to force every word into ${langName}. Sound like a helpful Indian government-scheme assistant speaking naturally.

NUMERICAL FACT SAFETY (critical):
- Never invent, alter, or substitute numerical figures (loan amounts, interest rates, moratorium periods, income limits).
- If the user asks for a specific loan amount (e.g. ₹3 Lakh), state their requested figure accurately. If the scheme ceiling is lower (e.g. ₹2.5 Lakh), explicitly contrast their request with the scheme maximum (e.g. "You requested ₹3 Lakh, while this scheme provides up to ₹2.5 Lakh"). Never silently change their requested amount to match the ceiling.

TOOLS & GROUNDING (critical):
- You have tools that return REAL data from the database and real financial math: recommend_schemes, calculate_emi, find_partners, get_required_documents, compare_schemes.
- NEVER invent or guess interest rates, loan limits, moratorium periods, EMI figures, partner names, addresses, or distances. Any time you need one of these, call the matching tool and use ONLY what it returns.
- Tool Selection Rules:
  * Call recommend_schemes when the user describes a business/education plan OR asks for details about a single scheme (e.g. "Tell me more about SUY", "What is GBS", "Explain MCF").
  * Call compare_schemes ONLY when the user explicitly asks to compare two or more distinct schemes (e.g. "Compare SUY and VETLS"). Never call compare_schemes for a single scheme detail query.
- If a tool needs information you don't have anywhere in this conversation, do NOT call it with a guessed value — instead, ask the user ONE short, warm, specific question to get exactly that missing piece, in ${langName}. Do not list multiple questions at once.
- If you already have enough from earlier in the conversation (including any "Known context" note or "STRUCTURED CONVERSATION CONTEXT" above), go ahead and call the tool — NEVER re-ask for something already given.
- Application process steps and general NSFDC background are safe to explain directly without a tool call — they aren't scheme-specific numbers.

STYLE:
- Warmly acknowledge the user's business idea, educational goal, or situation.
- Never say "Based on your profile" or "you are eligible" before real data confirms it — say "for this purpose..." or "based on what you've shared...".
- Keep replies concise, warm, and clear (a few sentences, not an essay), in ${langName}.
- Do not mention tool names, JSON, or internal mechanics to the user.
- Write in plain conversational prose only, like a person speaking — NEVER use Markdown formatting of any kind: no "#" or "##" headings, no "**bold**", no tables or "|" pipes, no "---" horizontal rules, no bullet lists with "-" or "*", no numbered lists.

INSTITUTIONAL JURISDICTION (GRAM PANCHAYAT vs. NSFDC CHANNELS):
- If the user asks whether they can apply through their local Gram Panchayat, Sarpanch, Mukhiya, or local agent, clarify with utmost authority:
  * Under Article 243G of the Constitution of India, Gram Panchayats govern local civic infrastructure and village development; they have NO statutory mandate or banking regulatory licensing to sanction or disburse NSFDC concessional loans.
  * All NSFDC subsidized loans are legally routed ONLY through accredited Channel Partners (State Channelizing Agencies - SCAs, Public Sector Banks, Regional Rural Banks, and NBFC-MFIs).
  * Direct digital channel routing through Pradarshak AI eliminates middleman cuts (dalals), guarantees 0% commission deductions, ensures direct DBT/escrow bank disbursement, and protects beneficiaries from predatory informal moneylenders.
`.trim();
}

// ── Type/intent inference from which tool ran ──────────────────────────────────

const TOOL_TO_TYPE: Record<string, ChatApiResponse['type']> = {
  recommend_schemes: 'schemes',
  calculate_emi: 'emi',
  find_partners: 'partners',
  get_required_documents: 'documents',
  compare_schemes: 'comparison',
};

const TOOL_TO_INTENT: Record<string, string> = {
  recommend_schemes: 'scheme_recommendation',
  calculate_emi: 'emi_calculation',
  find_partners: 'partner_locator',
  get_required_documents: 'document_requirements',
  compare_schemes: 'scheme_comparison',
};

// ── Markdown safety net ──────────────────────────────────────────────────
// The system prompt tells the model never to use Markdown, but free-tier /
// auto-routed models don't always follow formatting instructions reliably.
// Strip common Markdown artifacts (headings, bold/italic, tables, rules,
// list markers) as a defense-in-depth cleanup before the text ever reaches
// the chat UI, which only renders plain text.
function stripMarkdown(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^\s*[-|:*_]{3,}\s*$/.test(line)) // drop horizontal rules / table separator rows
    .map((line) => {
      let l = line;
      l = l.replace(/^\s{0,3}#{1,6}\s+/, ''); // headings
      l = l.replace(/^\s*[-*]\s+/, ''); // bullet markers
      l = l.replace(/^\s*\d+\.\s+/, ''); // numbered list markers
      l = l.replace(/\|/g, ' '); // table pipes
      l = l.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
      l = l.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1'); // italics
      l = l.replace(/`([^`]+)`/g, '$1'); // inline code
      return l.replace(/\s{2,}/g, ' ').trimEnd();
    })
    .filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === '')) // collapse repeated blank lines
    .join('\n')
    .trim();
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export const LOCALIZED_ERROR_MESSAGES: Record<string, string> = {
  en: 'Unable to process your request right now. Please try again in a moment.',
  hi: 'इस समय आपके अनुरोध पर कार्रवाई करने में असमर्थ। कृपया कुछ समय बाद पुनः प्रयास करें।',
  mr: 'यावेळी आपल्या विनंतीवर प्रक्रिया करण्यात अक्षम. कृपया काही वेळाने पुन्हा प्रयत्न करा.',
  bn: 'এই মুহূর্তে আপনার অনুরোধ প্রক্রিয়া করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
  gu: 'હમણાં તમારી વિનંતી પર પ્રક્રિયા કરવામાં અસમર્થ. કૃપા કરીને થોડી વાર પછી ફરી પ્રયાસ કરો।',
  kn: 'ಈ মুহূর্তে ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಲ ಸಮಯದ ನಂತರ ಮತ್ತೆ प्रयत्नಿಸಿ.',
  ml: 'ഇപ്പോൾ നിങ്ങളുടെ അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യാൻ സാധിക്കുന്നില്ല. ദയവായി കുറച്ച് സമയം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.',
  od: 'ଏହି ସମୟରେ ଆପଣଙ୍କ ଅନୁରୋଧ ପ୍ରକ୍ରିୟାକରଣ କରିବାରେ ଅସମର୍ଥ। ଦୟାକରି କିଛି ସମୟ ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।',
  pa: 'ਇਸ ਸਮੇਂ ਤੁਹਾਡੀ ਬੇਨਤੀ ਦੀ ਕਾਰਵਾਈ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  ta: 'தற்போது உங்கள் கோரிக்கையை ක්‍රியலாக்க முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
  te: 'ప్రస్తుతం మీ అభ్యర్థనను ప్రాసెస్ చేయలేకపోతున్నాము. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.',
};

export interface SchemeActionPayload {
  action: 'KNOW_MORE' | 'DOCUMENTS' | 'EMI' | 'COMPARE';
  schemeId?: number;
  schemeName?: string;
  schemeIds?: number[];
  schemeNames?: string[];
}

export function getComparisonSummaryText(schemes: Scheme[], lang: string = 'en'): string {
  const count = schemes.length;
  const names = schemes.map((s) => s.name).join(', ');
  if (lang === 'hi') {
    return `यहाँ चयनित ${count} योजनाओं की तुलना प्रस्तुत है: ${names}। ब्याज दर, ऋण सीमा और पुनर्भुगतान शर्तों के मुख्य अंतर नीचे दिए गए तुलना मैट्रिक्स में प्रदर्शित हैं।`;
  }
  if (lang === 'mr') {
    return `येथे निवडलेल्या ${count} योजनांची तुलना दिली आहे: ${names}. व्याज दर, कर्ज मर्यादा आणि परतफेडीच्या अटी खालील तुलना मॅट्रिक्समध्ये दर्शविल्या आहेत.`;
  }
  if (lang === 'bn') {
    return `এখানে নির্বাচিত ${count}টি প্রকল্পের তুলনা উপস্থাপন করা হলো: ${names}। সুদের হার, ঋণের সীমা এবং পরিশোধের শর্তাবলী নীচের তুলনা ম্যাট্রিক্সে প্রদর্শিত হয়েছে।`;
  }
  return `Here is the side-by-side comparison of the ${count} schemes: ${names}. Key differences in interest rates, loan limits, and repayment terms are highlighted in the comparison matrix below.`;
}

export function generateComparisonSpeechText(schemes: Scheme[], lang: string = 'en'): string {
  if (!schemes || schemes.length === 0) return '';
  const count = schemes.length;

  if (lang === 'hi') {
    const lines = schemes.map((s) => {
      const loan = s.max_loan_lakh ? `${s.max_loan_lakh} लाख रुपये` : 'उपलब्ध सीमा';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} प्रतिशत`
        : `${s.interest_rate_min} से ${s.interest_rate_max} प्रतिशत`;
      const tenure = s.max_tenure_months ? `अधिकतम ${s.max_tenure_months} महीने` : '';
      return `${s.name} में अधिकतम ऋण ${loan}, ब्याज दर ${rate} प्रति वर्ष और पुनर्भुगतान अवधि ${tenure} तक है।`;
    });
    return `${count} योजनाओं की तुलना। ${lines.join(' ')}`;
  }

  if (lang === 'mr') {
    const lines = schemes.map((s) => {
      const loan = s.max_loan_lakh ? `${s.max_loan_lakh} लाख रुपये` : 'उपलब्ध मर्यादा';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} टक्के`
        : `${s.interest_rate_min} ते ${s.interest_rate_max} टक्के`;
      const tenure = s.max_tenure_months ? `कमाल ${s.max_tenure_months} महिने` : '';
      return `${s.name} मध्ये कमाल कर्ज ${loan}, दरसाल व्याज ${rate} आणि परतफेड मुदत ${tenure} पर्यंत आहे.`;
    });
    return `${count} योजनांची तुलना. ${lines.join(' ')}`;
  }

  if (lang === 'bn') {
    const lines = schemes.map((s) => {
      const loan = s.max_loan_lakh ? `${s.max_loan_lakh} লাখ টাকা` : 'উপলব্ধ সীমা';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} শতাংশ`
        : `${s.interest_rate_min} থেকে ${s.interest_rate_max} শতাংশ`;
      const tenure = s.max_tenure_months ? `সর্বোচ্চ ${s.max_tenure_months} মাস` : '';
      return `${s.name}-এ সর্বোচ্চ ঋণ ${loan}, বার্ষিক সুদের হার ${rate} এবং পরিশোধের মেয়াদ ${tenure} পর্যন্ত।`;
    });
    return `${count}টি প্রকল্পের তুলনা। ${lines.join(' ')}`;
  }

  if (lang === 'gu') {
    const lines = schemes.map((s) => {
      const loan = s.max_loan_lakh ? `${s.max_loan_lakh} લાખ રૂપિયા` : 'ઉપલબ્ધ મર્યાદા';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} ટકા`
        : `${s.interest_rate_min} થી ${s.interest_rate_max} ટકા`;
      const tenure = s.max_tenure_months ? `મહત્તમ ${s.max_tenure_months} મહિના` : '';
      return `${s.name}માં મહત્તમ લોન ${loan}, વાર્ષિક વ્યાજ દર ${rate} અને પુનઃચુકવણીની મુદત ${tenure} સુધીની છે.`;
    });
    return `${count} યોજનાઓની સરખામણી. ${lines.join(' ')}`;
  }

  const lines = schemes.map((s) => {
    const loan = s.max_loan_lakh ? `${s.max_loan_lakh} lakh rupees` : 'specified limits';
    const rate = s.interest_rate_min === s.interest_rate_max
      ? `${s.interest_rate_min} percent`
      : `${s.interest_rate_min} to ${s.interest_rate_max} percent`;
    const tenure = s.max_tenure_months ? `up to ${s.max_tenure_months} months` : '';
    return `${s.name} has a maximum loan of ${loan} with an interest rate of ${rate} per annum and a repayment tenure of ${tenure}.`;
  });
  return `Comparing ${count} schemes. ${lines.join(' ')}`;
}

export function generateDocumentsSpeechText(schemeName: string, mandatory: string[], conditional: string[], lang: string = 'en'): string {
  const sName = schemeName || 'this scheme';
  if (lang === 'hi') {
    const mStr = mandatory.map((d) => d.split('(')[0].trim()).join(', ');
    const cStr = conditional.length > 0 ? `। परिस्थिति अनुसार आवश्यक दस्तावेज: ${conditional.map((d) => d.split('(')[0].trim()).join(', ')}` : '';
    return `${sName} के लिए आवश्यक दस्तावेज। अनिवार्य दस्तावेज हैं: ${mStr}${cStr}। मूल प्रमाण पत्र सत्यापन हेतु आवश्यक हैं।`;
  }
  if (lang === 'mr') {
    const mStr = mandatory.map((d) => d.split('(')[0].trim()).join(', ');
    const cStr = conditional.length > 0 ? `। परिस्थितीनुसार लागणारी अतिरिक्त कागदपत्रे: ${conditional.map((d) => d.split('(')[0].trim()).join(', ')}` : '';
    return `${sName} साठी आवश्यक कागदपत्रे. अनिवार्य कागदपत्रे आहेत: ${mStr}${cStr}. पडताळणीसाठी मूळ प्रमाणपत्रे सादर करणे आवश्यक आहे.`;
  }
  if (lang === 'bn') {
    const mStr = mandatory.map((d) => d.split('(')[0].trim()).join(', ');
    const cStr = conditional.length > 0 ? `। পরিস্থিতি অনুযায়ী প্রয়োজনীয় অতিরিক্ত নথি: ${conditional.map((d) => d.split('(')[0].trim()).join(', ')}` : '';
    return `${sName}-এর জন্য প্রয়োজনীয় নথি। বাধ্যতামূলক নথিগুলি হলো: ${mStr}${cStr}। যাচাইকরণের জন্য আসল শংসাপত্র উপস্থাপন করতে হবে।`;
  }
  if (lang === 'gu') {
    const mStr = mandatory.map((d) => d.split('(')[0].trim()).join(', ');
    const cStr = conditional.length > 0 ? `। સંજોગો અનુસાર જરૂરી વધારાના દસ્તાવેજો: ${conditional.map((d) => d.split('(')[0].trim()).join(', ')}` : '';
    return `${sName} માટે જરૂરી દસ્તાવેજો. ફરજિયાત દસ્તાવેજો છે: ${mStr}${cStr}। ચકાસણી માટે મૂળ પ્રમાણપત્રો રજૂ કરવા જરૂરી છે.`;
  }
  const mStr = mandatory.map((d) => d.split('(')[0].trim()).join(', ');
  const cStr = conditional.length > 0 ? `. Additional documents depending on your business: ${conditional.map((d) => d.split('(')[0].trim()).join(', ')}` : '';
  return `Required documents for ${sName}. Mandatory documents include: ${mStr}${cStr}. Original certificates must be presented for verification at the channel partner branch.`;
}

export function generateEmiSpeechText(schemeName: string, emi: number, principal: number, rate: number, tenure: number, moratorium: number, lang: string = 'en'): string {
  const sName = schemeName || 'the loan scheme';
  const emiStr = emi ? `₹${emi.toLocaleString('en-IN')}` : '';
  const pStr = principal ? `₹${principal.toLocaleString('en-IN')}` : '';
  if (lang === 'hi') {
    return `${sName} के लिए अनुमानित मासिक ईएमआई ${emiStr} है। मूल ऋण राशि ${pStr} पर ${rate} प्रतिशत वार्षिक ब्याज और ${tenure} महीने की अवधि है, जिसमें ${moratorium} महीने की छूट अवधि शामिल है।`;
  }
  if (lang === 'mr') {
    return `${sName} साठी अंदाजे मासिक ईएमआई ${emiStr} आहे. मूळ कर्ज रक्कम ${pStr} वर दरसाल ${rate} टक्के व्याज आणि ${tenure} महिने मुदत आहे, ज्यामध्ये ${moratorium} महिन्यांचा मोरेटोरियम कालावधी समाविष्ट आहे.`;
  }
  if (lang === 'bn') {
    return `${sName}-এর জন্য আনুমানিক মাসিক ইএমআই হলো ${emiStr}। মূল ঋণের পরিমাণ ${pStr}-এর উপর বার্ষিক ${rate} শতাংশ সুদে ${tenure} মাসের মেয়াদ, যার মধ্যে ${moratorium} মাসের গ্রেস পিরিয়ড অন্তর্ভুক্ত রয়েছে।`;
  }
  if (lang === 'gu') {
    return `${sName} માટે અંદાજિત માસિક EMI ${emiStr} છે. મૂળ લોન રકમ ${pStr} પર વાર્ષિક ${rate} ટકા વ્યાજ અને ${tenure} મહિનાની મુદત છે, જેમાં ${moratorium} મહિનાનો મોરેટોરિયમ ગ્રેસ સમયગાળો શામેલ છે.`;
  }
  return `For ${sName}, the estimated monthly EMI is ${emiStr} for a loan of ${pStr} at ${rate} percent annual interest over ${tenure} months, including a ${moratorium} month moratorium grace period.`;
}

export async function resolveComparisonFromQuery(
  message: string,
  sessionContext?: Record<string, unknown>
): Promise<Scheme[] | null> {
  const norm = normalizeSchemeText(message);
  const isCompareIntent =
    norm.includes('compare') ||
    norm.includes('comparison') ||
    norm.includes('versus') ||
    norm.includes(' vs ') ||
    norm.includes('vs ') ||
    norm.includes('tulna') ||
    message.includes('तुलना') ||
    message.includes('तुलना करा') ||
    message.includes('સરખામણી') ||
    message.includes('તુલના') ||
    message.includes('फरक');

  if (!isCompareIntent) return null;

  const activeSchemes = await fetchActiveSchemes();
  const matchedSchemes: Scheme[] = [];

  for (const s of activeSchemes) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    const acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));

    const words = norm.split(' ');
    const isMatched =
      (acronym && words.includes(acronym)) ||
      (shortName && words.includes(shortName)) ||
      (baseName && (norm.includes(baseName) || words.includes(baseName))) ||
      (fullName && norm.includes(fullName)) ||
      normAliases.some((alias) => alias.length >= 2 && (norm.includes(alias) || words.includes(alias)));

    if (isMatched && !matchedSchemes.some((m) => m.id === s.id)) {
      matchedSchemes.push(s);
    }
  }

  if (matchedSchemes.length >= 2) {
    return matchedSchemes;
  }

  const recentSchemes = (sessionContext?.recommend_schemes as any)?.schemes ||
                        (sessionContext?.schemes as any) ||
                        (sessionContext?.compare_schemes as any)?.schemes;
  if (Array.isArray(recentSchemes) && recentSchemes.length >= 2 && matchedSchemes.length === 0) {
    return recentSchemes.slice(0, 4) as Scheme[];
  }

  return null;
}


export function cleanAndFormatPostRecommendation(
  text: string,
  lang: string = 'en',
  hasLoanAmount: boolean = false
): string {
  let cleaned = text.trim();

  // 1. Strip generic asking for course or loan amount if loan amount or business is known
  cleaned = cleaned.replace(/Could you (?:please )?share your intended course and required loan amount[^.?!\r\n]*[.?!\r\n]?/gi, '');
  cleaned = cleaned.replace(/Could you (?:please )?share your (?:intended )?course[^.?!\r\n]*[.?!\r\n]?/gi, '');
  if (hasLoanAmount) {
    cleaned = cleaned.replace(/Could you (?:please )?share your (?:required )?loan amount[^.?!\r\n]*[.?!\r\n]?/gi, '');
    cleaned = cleaned.replace(/What loan amount (?:are you considering|do you need)[^.?!\r\n]*[.?!\r\n]?/gi, '');
    cleaned = cleaned.replace(/Please let me know (?:how much|the) loan amount[^.?!\r\n]*[.?!\r\n]?/gi, '');
    cleaned = cleaned.replace(/कितना ऋण[^.?!\r\n]*[.?!\r\n]?/gi, '');
    cleaned = cleaned.replace(/कर्ज रक्कम[^.?!\r\n]*[.?!\r\n]?/gi, '');
  }

  cleaned = cleaned.trim();

  const cta = POST_RECOMMENDATION_CTA[lang] || POST_RECOMMENDATION_CTA.en;
  // 2. Ensure post-recommendation CTA is present
  if (
    !cleaned.includes('channel partner') &&
    !cleaned.includes('चैनल पार्टनर') &&
    !cleaned.includes('चॅनेल भागीदार') &&
    !cleaned.includes('চ্যানেল পার্টনার') &&
    !cleaned.includes('ચેનલ પાર્ટનર')
  ) {
    cleaned = cleaned ? `${cleaned}\n\n${cta}` : cta;
  }

  return cleaned;
}

const MAX_TOOL_ROUNDS = 3;

export async function process(
  message: string,
  sessionId?: string,
  requestedLanguage?: string,
  detectedSpeechLanguage?: string,
  speechProbability?: number,
  category?: string,
  userContext?: UserProfileContext,
  schemeAction?: SchemeActionPayload
): Promise<ChatApiResponse> {
  const session: Session = getOrCreate(sessionId);

  if (userContext) {
    session.userContext = { ...session.userContext, ...userContext };
  }
  const effectiveUserContext = session.userContext || userContext;

  const resolution = resolveEffectiveLanguage({
    selectedLanguage: requestedLanguage,
    detectedSpeechLanguage,
    speechProbability,
    message,
  });

  session.language = resolution.effectiveLanguage as Language;

  // 1. Extract and update structured persistent facts
  session.knownFacts = extractAndUpdateFacts(session.knownFacts || {}, message, effectiveUserContext);

  // ── Pipeline Logging ──────────────────────────────────────────────────
  console.log(`[CHAT] user_message="${message.substring(0, 120)}" session=${session.id} lang=${session.language}`);
  console.log(`[CONTEXT] knownFacts=${JSON.stringify({
    business_type: session.knownFacts.business_type,
    purpose: session.knownFacts.purpose,
    loan_amount_rs: session.knownFacts.loan_amount_rs,
    category_hint: session.knownFacts.category_hint,
    family_income_rs: session.knownFacts.family_income_rs,
    location: session.knownFacts.location,
    gender: session.knownFacts.gender,
    last_schemes: session.knownFacts.last_recommended_schemes?.map(s => s.name),
  })}`);
  if (effectiveUserContext) {
    console.log(`[CONTEXT] userProfile: salary=${effectiveUserContext.salary}, city=${effectiveUserContext.city}, gender=${effectiveUserContext.gender}, trade=${effectiveUserContext.trade_category}, caste=${effectiveUserContext.caste_category}`);
  }

  session.conversationHistory.push({ role: 'user', content: message });

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(session.language, category, effectiveUserContext, session.knownFacts) },
  ];

  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: `Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): ${JSON.stringify(session.lastContext)}`,
    });
  }

  // Active recommended schemes from earlier in this conversation for pronoun & reference resolution
  if (session.knownFacts?.last_recommended_schemes && session.knownFacts.last_recommended_schemes.length > 0) {
    const listStr = session.knownFacts.last_recommended_schemes
      .map((s, idx) => `[${idx + 1}] ${s.name} (Max Loan: ₹${s.max_loan_lakh}L)`)
      .join(', ');
    messages.push({
      role: 'system',
      content: `CURRENT ACTIVE RECOMMENDED SCHEMES IN THIS CONVERSATION: ${listStr}. When the user says "the first one", "first scheme", "that scheme", or "this loan", refer directly to these.`,
    });
  }

  // Bound conversation history to last 10 turns to avoid token inflation
  const historySlice = session.conversationHistory.slice(-10);
  for (const turn of historySlice) {
    messages.push({ role: turn.role, content: turn.content });
  }

  const currentCfg = getLanguageConfig(session.language);
  const currentLangName = currentCfg ? currentCfg.name : 'English';
  messages.push({
    role: 'system',
    content: `AUTHORITATIVE RESPONSE LANGUAGE FOR THIS TURN: Respond strictly in ${currentLangName} (${session.language}). Ignore any previous turn's response language if different.`,
  });

  let lastToolName: string | null = null;
  let lastToolData: Record<string, unknown> | undefined;
  let finalText = '';
  let speechText: string | undefined;

  if (schemeAction) {
    let targetScheme: Scheme | null = null;
    if (schemeAction.schemeId != null) {
      targetScheme = await fetchSchemeById(Number(schemeAction.schemeId));
    }
    if (!targetScheme && schemeAction.schemeName) {
      targetScheme = await fetchSchemeByName(schemeAction.schemeName);
    }
    if (targetScheme) {
      session.lastContext = { ...(session.lastContext || {}), selectedScheme: targetScheme };
    }

    try {
      if (schemeAction.action === 'KNOW_MORE') {
        lastToolName = 'recommend_schemes';
        const s = targetScheme || (await fetchActiveSchemes())[0];
        lastToolData = {
          schemes: [{
            ...s,
            score: 100,
            matchReasons: ['Beneficiary requested detailed scheme information'],
            warnings: [],
          }],
        };

        const instruction = `
The user wants to learn more about the following government/financial scheme:

Scheme: ${s.name}
Category: ${s.category}
Interest Rate: ${s.interest_rate_min === s.interest_rate_max ? `${s.interest_rate_min}% p.a.` : `${s.interest_rate_min}%–${s.interest_rate_max}% p.a.`}
Maximum Loan: ₹${s.max_loan_lakh} Lakh${s.min_loan_lakh ? ` (Minimum: ₹${s.min_loan_lakh} Lakh)` : ''}
Family Annual Income Ceiling: ≤ ₹${s.max_income_lakh} Lakh
Repayment Tenure: Up to ${s.max_tenure_months} months
Moratorium / Grace Period: ${s.moratorium_months_min}–${s.moratorium_months_max} months
Target Beneficiaries: ${s.gender_eligibility === 'women_only' ? 'SC Women Only' : 'All SC Beneficiaries'}
Eligible Activities: ${(s.eligible_project_types || []).join(', ')}
Routing / Channel Partners: ${(s.channel_partner_types || []).join(', ')}
Official Description: ${s.description}
${s.notes ? `Official Notes: ${s.notes}` : ''}

Explain this specific scheme in detail in a simple and understandable way in ${currentLangName} (${session.language}).
Cover:
- What the scheme is
- Who is eligible
- Maximum loan/financial assistance
- Applicable interest rate
- Loan tenure
- Moratorium/grace period
- Eligible activities/purposes
- Income eligibility
- Important eligibility conditions
- Documents generally required
- How the user can apply
- How this scheme can benefit the user based on their profile
- Important limitations or conditions

Do not discuss unrelated schemes unless necessary for clarification.
Use the scheme data above as the primary authoritative source. Do not invent scheme-specific facts.
Write in plain conversational prose only.
`.trim();

        const reply = await llmChat({
          messages: [...messages, { role: 'user', content: instruction }],
          maxTokens: 750,
        });
        finalText = reply.content || '';
        speechText = finalText;
      } else if (schemeAction.action === 'DOCUMENTS') {
        const s = targetScheme;
        const docResult = await executeTool('get_required_documents', {
          scheme_id: s?.id,
          scheme_name: s?.name || schemeAction.schemeName,
          is_education: s?.category === 'education_loan',
        });
        lastToolName = 'get_required_documents';
        lastToolData = docResult.data;

        speechText = generateDocumentsSpeechText(
          s?.name || schemeAction.schemeName || 'this scheme',
          (docResult.data as any).mandatoryDocuments || [],
          (docResult.data as any).conditionalDocuments || [],
          session.language
        );
        lastToolData.speechText = speechText;

        const instruction = `
The user wants to know the complete document checklist for this specific scheme:

Scheme: ${s?.name || schemeAction.schemeName || 'Requested Scheme'}
Mandatory Documents: ${JSON.stringify((docResult.data as any).mandatoryDocuments)}
Conditional / Additional Documents: ${JSON.stringify((docResult.data as any).conditionalDocuments)}

Provide a clear and complete document checklist required to apply for this scheme in ${currentLangName} (${session.language}).
Clearly distinguish:
1. Documents that are generally mandatory
2. Documents that may be required depending on the applicant's circumstances
Do not ask the user which scheme they mean because the scheme name is already provided by the button action.
Write in plain conversational prose only.
`.trim();

        const reply = await llmChat({
          messages: [...messages, { role: 'user', content: instruction }],
          maxTokens: 750,
        });
        finalText = reply.content || speechText;
      } else if (schemeAction.action === 'EMI') {
        const s = targetScheme;
        const principal = s ? s.max_loan_lakh * 100000 : 100000;
        const rate = s ? s.interest_rate_min : 6.5;
        const tenure = s ? s.max_tenure_months : 36;
        const morat = s ? s.moratorium_months_min : 3;

        const emiResult = await executeTool('calculate_emi', {
          loan_amount_rs: principal,
          interest_rate_pct: rate,
          tenure_months: tenure,
          moratorium_months: morat,
        });

        lastToolName = 'calculate_emi';
        lastToolData = {
          ...emiResult.data,
          schemeName: s?.name || schemeAction.schemeName || null,
          schemeId: s?.id || null,
          scheme: s || null,
        };

        speechText = generateEmiSpeechText(
          s?.name || schemeAction.schemeName || 'the loan scheme',
          Number((emiResult.data as any).emi || 0),
          principal,
          rate,
          tenure,
          morat,
          session.language
        );
        lastToolData.speechText = speechText;

        const instruction = `
Explain the monthly EMI repayment and moratorium grace period for ${s?.name || schemeAction.schemeName || 'the scheme'} in ${currentLangName} (${session.language}):
Principal Loan Amount: ₹${principal.toLocaleString('en-IN')}
Subsidized Interest Rate: ${rate}% p.a.
Repayment Tenure: ${tenure} months
Moratorium (Grace Period): ${morat} months
Calculated Monthly EMI: ₹${((emiResult.data as any).emi || 0).toLocaleString('en-IN')}
Total Interest: ₹${((emiResult.data as any).totalInterest || 0).toLocaleString('en-IN')}
Total Outflow / Repayment: ₹${((emiResult.data as any).totalPayable || 0).toLocaleString('en-IN')}

Explain clearly and warmly that during the ${morat}-month moratorium no principal repayment is required, and how the monthly EMI is calculated. Mention that the user can customize the loan amount and tenure in the interactive EMI calculator. Write in plain conversational prose only.
`.trim();

        const reply = await llmChat({
          messages: [...messages, { role: 'user', content: instruction }],
          maxTokens: 750,
        });
        finalText = reply.content || speechText;
      } else if (schemeAction.action === 'COMPARE') {
        const compResult = await executeTool('compare_schemes', {
          scheme_ids: schemeAction.schemeIds,
          scheme_names: schemeAction.schemeNames,
        });
        lastToolName = 'compare_schemes';
        lastToolData = compResult.data;
        const schemesList = (compResult.data.schemes as Scheme[]) || [];
        speechText = generateComparisonSpeechText(schemesList, session.language);
        finalText = getComparisonSummaryText(schemesList, session.language);
        lastToolData.speechText = speechText;
      }
    } catch (actErr) {
      console.warn('[ChatOrchestrator] Scheme action LLM call fallback:', (actErr as Error)?.message);
      if (schemeAction.action === 'KNOW_MORE') {
        finalText = session.language === 'hi'
          ? `${targetScheme?.name || 'योजना'} का विस्तृत विवरण नीचे प्रस्तुत है।`
          : session.language === 'mr'
          ? `${targetScheme?.name || 'योजना'}चे सविस्तर मार्गदर्शक तत्त्वे आणि अटी खाली दिल्या आहेत.`
          : session.language === 'bn'
          ? `${targetScheme?.name || 'প্রকল্প'} এর বিস্তারিত নির্দেশিকা ও শর্তাবলী নীচে দেওয়া হলো।`
          : `${targetScheme?.name || 'Scheme'} detailed guidelines and terms are provided below.`;
        speechText = finalText;
      } else if (schemeAction.action === 'DOCUMENTS') {
        finalText = session.language === 'hi'
          ? `${targetScheme?.name || 'इस योजना'} के लिए आवश्यक दस्तावेजों की सूची नीचे दी गई है।`
          : session.language === 'mr'
          ? `${targetScheme?.name || 'या योजने'}साठी आवश्यक कागदपत्रांची यादी खाली दिली आहे.`
          : session.language === 'bn'
          ? `${targetScheme?.name || 'এই প্রকল্পের'} জন্য প্রয়োজনীয় নথিপত্রের তালিকা নীচে দেওয়া হলো।`
          : `Here is the checklist of required documents for ${targetScheme?.name || 'this scheme'}.`;
        speechText = finalText;
      } else if (schemeAction.action === 'EMI') {
        finalText = session.language === 'hi'
          ? `${targetScheme?.name || 'इस योजना'} के लिए ईएमआई गणना नीचे दी गई है।`
          : session.language === 'mr'
          ? `${targetScheme?.name || 'या योजने'}साठी ईएमआई गणना खाली दिली आहे.`
          : session.language === 'bn'
          ? `${targetScheme?.name || 'এই প্রকল্পের'} জন্য ইএমআই হিসাব নীচে দেওয়া হলো।`
          : `Here is the calculated EMI schedule for ${targetScheme?.name || 'this scheme'}.`;
        speechText = finalText;
      } else {
        const sList = (lastToolData?.schemes as Scheme[]) || [];
        finalText = getComparisonSummaryText(sList, session.language);
        speechText = generateComparisonSpeechText(sList, session.language);
      }
    }
  } else {
    // 1. Check if user is asking directly to compare schemes in their query
    const directCompareSchemes = await resolveComparisonFromQuery(message, session.lastContext);
    if (directCompareSchemes && directCompareSchemes.length >= 2) {
      lastToolName = 'compare_schemes';
      lastToolData = {
        schemes: directCompareSchemes,
        schemeA: directCompareSchemes[0] || null,
        schemeB: directCompareSchemes[1] || null,
      };
      speechText = generateComparisonSpeechText(directCompareSchemes, session.language);
      finalText = getComparisonSummaryText(directCompareSchemes, session.language);
      lastToolData.speechText = speechText;
    } else {
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const assistantMsg = await llmChat({ messages, tools: TOOL_DEFS, maxTokens: 700 });

          if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
            console.log(`[ROUTER] LLM round ${round}: tool_calls=[${assistantMsg.tool_calls.map(tc => tc.function.name).join(', ')}]`);
            messages.push({ role: 'assistant', content: assistantMsg.content ?? null, tool_calls: assistantMsg.tool_calls });

            for (const call of assistantMsg.tool_calls) {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(call.function.arguments || '{}');
              } catch {
                args = {};
              }

              // Pre-populate missing or enrich tool arguments from verified profile & known conversation facts
              if (call.function.name === 'recommend_schemes') {
                if (!args.purpose) {
                  args.purpose = session.knownFacts?.purpose || session.knownFacts?.business_type || effectiveUserContext?.trade_category;
                } else if (session.knownFacts?.business_type && !String(args.purpose).toLowerCase().includes(session.knownFacts.business_type.toLowerCase())) {
                  args.purpose = `${session.knownFacts.business_type} - ${args.purpose}`;
                }

                if (!args.query) {
                  args.query = session.knownFacts?.business_type || message;
                } else if (session.knownFacts?.business_type && !String(args.query).toLowerCase().includes(session.knownFacts.business_type.toLowerCase())) {
                  args.query = `${session.knownFacts.business_type} ${args.query}`;
                }

                if (args.loan_amount_rs == null && session.knownFacts?.loan_amount_rs != null) {
                  args.loan_amount_rs = session.knownFacts.loan_amount_rs;
                }

                if (args.family_income_rs == null) {
                  if (session.knownFacts?.family_income_rs != null) {
                    args.family_income_rs = session.knownFacts.family_income_rs;
                  } else if (effectiveUserContext?.salary != null) {
                    args.family_income_rs = Number(effectiveUserContext.salary);
                  }
                }

                if (!args.location) {
                  args.location = session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city;
                }

                if (!args.gender && effectiveUserContext?.gender) {
                  args.gender = effectiveUserContext.gender.toLowerCase();
                }

                if (!args.education_level && (session.knownFacts?.education_level || effectiveUserContext?.education_level)) {
                  args.education_level = session.knownFacts?.education_level || effectiveUserContext?.education_level;
                }

                if (!args.category_hint) {
                  if (session.knownFacts?.business_type) {
                    args.category_hint = 'business_loan';
                  } else if (session.knownFacts?.education_level) {
                    args.category_hint = 'education_loan';
                  }
                }
              } else if (call.function.name === 'find_partners') {
                if (!args.location && (session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city)) {
                  args.location = session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city;
                }
              } else if (call.function.name === 'calculate_emi') {
                if (args.loan_amount_rs == null && session.knownFacts?.loan_amount_rs != null) {
                  args.loan_amount_rs = session.knownFacts.loan_amount_rs;
                }
                if (!args.scheme_name && !args.scheme_id && session.knownFacts?.last_recommended_schemes?.length) {
                  args.scheme_name = session.knownFacts.last_recommended_schemes[0].name;
                  args.scheme_id = session.knownFacts.last_recommended_schemes[0].id;
                }
              } else if (call.function.name === 'get_required_documents') {
                if (!args.scheme_name && !args.scheme_id && session.knownFacts?.last_recommended_schemes?.length) {
                  args.scheme_name = session.knownFacts.last_recommended_schemes[0].name;
                  args.scheme_id = session.knownFacts.last_recommended_schemes[0].id;
                }
              }

              console.log(`[ROUTER] Calling tool: ${call.function.name} args=${JSON.stringify(args).substring(0, 300)}`);
              const result = await executeTool(call.function.name, args);
              console.log(`[ROUTER] Tool result: ${result.toolName} schemeCount=${Array.isArray(result.data?.schemes) ? (result.data.schemes as any[]).length : 'N/A'}`);
              lastToolName = result.toolName;
              lastToolData = result.data;

              // Cache top recommended schemes in session knownFacts for pronoun & follow-up resolution
              if (result.toolName === 'recommend_schemes' && Array.isArray(result.data?.schemes)) {
                session.knownFacts.last_recommended_schemes = (result.data.schemes as Scheme[]).slice(0, 5).map((s) => ({
                  id: s.id,
                  name: s.name,
                  category: s.category,
                  max_loan_lakh: s.max_loan_lakh,
                }));
              }

              // Immediately compute authoritative speechText
              if (result.toolName === 'compare_schemes') {
                speechText = generateComparisonSpeechText((result.data.schemes as Scheme[]) || [], session.language);
                lastToolData.speechText = speechText;
              } else if (result.toolName === 'calculate_emi') {
                speechText = generateEmiSpeechText(
                  (result.data.schemeName as string) || '',
                  Number(result.data.emi || 0),
                  Number(result.data.principal || 0),
                  Number(result.data.interestRatePct || 0),
                  Number(result.data.tenureMonths || 0),
                  Number(result.data.moratoriumMonths || 0),
                  session.language
                );
                lastToolData.speechText = speechText;
              } else if (result.toolName === 'get_required_documents') {
                speechText = generateDocumentsSpeechText(
                  (result.data.schemeName as string) || '',
                  (result.data.mandatoryDocuments as string[]) || [],
                  (result.data.conditionalDocuments as string[]) || [],
                  session.language
                );
                lastToolData.speechText = speechText;
              }

              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result.data),
              });
            }
            continue; // let the model produce the grounded explanation (or another tool call) next round
          }

          finalText = assistantMsg.content || '';
          console.log(`[ROUTER] LLM round ${round}: no tool call, finalText=${finalText ? 'present (' + finalText.length + ' chars)' : 'EMPTY'}`);
          break;
        }
      } catch (llmErr) {
        console.warn('[ChatOrchestrator] LLM call fallback triggered:', (llmErr as Error)?.message);
        const fallbackResult = await executeTool('recommend_schemes', {
          query: session.knownFacts?.business_type || message,
          loan_amount_rs: session.knownFacts?.loan_amount_rs,
          purpose: session.knownFacts?.purpose || session.knownFacts?.business_type,
          family_income_rs: session.knownFacts?.family_income_rs || (effectiveUserContext?.salary ? Number(effectiveUserContext.salary) : undefined),
          location: session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city,
          category_hint: session.knownFacts?.business_type ? 'business_loan' : undefined,
        });
        lastToolName = fallbackResult.toolName;
        lastToolData = fallbackResult.data;
        finalText = session.language === 'hi'
          ? 'आपकी आवश्यकता के अनुसार उपयुक्त योजनाएं नीचे प्रदर्शित की गई हैं।'
          : session.language === 'mr'
          ? 'तुमच्या गरजेनुसार योग्य योजना खाली दाखवल्या आहेत.'
          : 'Here are the recommended schemes matching your inquiry.';
      }
    }
  }

  // Safety net: Never produce generic fallback if a tool succeeded with real data
  if (!finalText) {
    if (lastToolName === 'compare_schemes' && lastToolData?.schemes) {
      finalText = getComparisonSummaryText(lastToolData.schemes as Scheme[], session.language);
      speechText = generateComparisonSpeechText(lastToolData.schemes as Scheme[], session.language);
    } else if (lastToolName === 'calculate_emi' && lastToolData?.emi) {
      finalText = generateEmiSpeechText(
        lastToolData.schemeName as string,
        Number(lastToolData.emi),
        Number(lastToolData.principal),
        Number(lastToolData.interestRatePct),
        Number(lastToolData.tenureMonths),
        Number(lastToolData.moratoriumMonths),
        session.language
      );
      speechText = finalText;
    } else if (lastToolName === 'get_required_documents' && lastToolData?.documents) {
      finalText = generateDocumentsSpeechText(
        lastToolData.schemeName as string,
        (lastToolData.mandatoryDocuments as string[]) || [],
        (lastToolData.conditionalDocuments as string[]) || [],
        session.language
      );
      speechText = finalText;
    } else if (lastToolName === 'recommend_schemes' && lastToolData?.schemes) {
      finalText = session.language === 'hi'
        ? 'आपकी आवश्यकता के अनुसार उपयुक्त योजनाएं नीचे प्रदर्शित की गई हैं।'
        : session.language === 'mr'
        ? 'तुमच्या गरजेनुसार योग्य योजना खाली दाखवल्या आहेत.'
        : session.language === 'bn'
        ? 'আপনার প্রয়োজনীয়তা অনুযায়ী উপযুক্ত প্রকল্পগুলি নীচে প্রদর্শিত হয়েছে।'
        : 'Here are the recommended schemes matching your inquiry.';
      speechText = finalText;
    } else {
      // ── SMART FALLBACK: detect scheme-related queries and call recommend_schemes directly ──
      const lowerMsg = message.toLowerCase();
      const isSchemeRelated =
        session.knownFacts?.business_type ||
        session.knownFacts?.category_hint ||
        session.knownFacts?.purpose ||
        /scheme|loan|business|education|tailoring|shop|college|school|money|fund|assist|help|available|suggest|recommend|emi|partner|योजना|ऋण|ऋण|कर्ज|व्यवसाय|शिक्षा/i.test(lowerMsg);

      if (isSchemeRelated) {
        console.log('[ROUTER] Smart fallback: LLM returned empty, but message is scheme-related. Calling recommend_schemes directly.');
        try {
          const smartFallbackResult = await executeTool('recommend_schemes', {
            query: message,
            purpose: session.knownFacts?.purpose || session.knownFacts?.business_type || message,
            loan_amount_rs: session.knownFacts?.loan_amount_rs,
            family_income_rs: session.knownFacts?.family_income_rs || (effectiveUserContext?.salary ? Number(effectiveUserContext.salary) : undefined),
            location: session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city,
            gender: session.knownFacts?.gender || effectiveUserContext?.gender?.toLowerCase(),
            category_hint: session.knownFacts?.category_hint,
          });
          lastToolName = smartFallbackResult.toolName;
          lastToolData = smartFallbackResult.data;

          // Cache recommended schemes
          if (Array.isArray(smartFallbackResult.data?.schemes)) {
            session.knownFacts.last_recommended_schemes = (smartFallbackResult.data.schemes as Scheme[]).slice(0, 5).map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category,
              max_loan_lakh: s.max_loan_lakh,
            }));
          }

          const schemeCount = Array.isArray(smartFallbackResult.data?.schemes) ? (smartFallbackResult.data.schemes as any[]).length : 0;
          console.log(`[RESPONSE] Smart fallback returned ${schemeCount} schemes`);

          finalText = session.language === 'hi'
            ? 'आपकी आवश्यकता के अनुसार उपयुक्त योजनाएं नीचे प्रदर्शित की गई हैं।'
            : session.language === 'mr'
            ? 'तुमच्या गरजेनुसार योग्य योजना खाली दाखवल्या आहेत.'
            : session.language === 'bn'
            ? 'আপনার প্রয়োজনীয়তা অনুযায়ী উপযুক্ত প্রকল্পগুলি নীচে প্রদর্শিত হয়েছে।'
            : 'Here are the recommended schemes matching your inquiry.';
          speechText = finalText;
        } catch (fallbackErr) {
          console.error('[ROUTER] Smart fallback also failed:', (fallbackErr as Error)?.message);
          finalText = LOCALIZED_ERROR_MESSAGES[session.language] || LOCALIZED_ERROR_MESSAGES.en;
          speechText = finalText;
        }
      } else {
        // Truly unrecognizable query — give a graceful error, not "rephrase"
        console.log('[ROUTER] No scheme-related signal in message, returning graceful error.');
        finalText = LOCALIZED_ERROR_MESSAGES[session.language] || LOCALIZED_ERROR_MESSAGES.en;
        speechText = finalText;
      }
    }
  }

  if (lastToolName === 'recommend_schemes') {
    finalText = cleanAndFormatPostRecommendation(
      finalText,
      session.language,
      session.knownFacts?.loan_amount_rs != null
    );
  }

  finalText = stripMarkdown(finalText);

  if (!speechText) {
    speechText = finalText;
  }
  if (lastToolData && !lastToolData.speechText) {
    lastToolData.speechText = speechText;
  }

  const type: ChatApiResponse['type'] = lastToolName
    ? TOOL_TO_TYPE[lastToolName] || 'text'
    : finalText.trim().endsWith('?')
    ? 'question'
    : 'text';
  const intent = lastToolName ? TOOL_TO_INTENT[lastToolName] || 'general' : type === 'question' ? 'general' : 'greeting';

  // Keep a compact snapshot of the latest real data for next-turn continuity
  if (lastToolData) {
    session.lastContext = { ...(session.lastContext || {}), [lastToolName as string]: lastToolData };
  }
  session.lastIntent = intent;
  session.conversationHistory.push({ role: 'assistant', content: finalText });
  updateSession(session);

  const response: ChatApiResponse = {
    sessionId: session.id,
    message: finalText,
    speechText,
    type,
    data: lastToolData,
    quickActions: QUICK_ACTIONS[type],
    disclaimer: type === 'schemes' ? (DISCLAIMER[session.language] || DISCLAIMER.en) : undefined,
    detectedLanguage: session.language,
    intent,
  };

  return response;
}
