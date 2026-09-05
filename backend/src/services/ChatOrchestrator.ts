import { detectLanguage } from './IntentClassifier';
import type { Language } from './IntentClassifier';
import { getOrCreate, updateSession } from './ConversationSession';
import type { Session } from './ConversationSession';
import { TOOL_DEFS, executeTool } from './Tools';
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
  type: 'text' | 'schemes' | 'emi' | 'partners' | 'comparison' | 'documents' | 'question';
  data?: Record<string, unknown>;
  quickActions?: QuickAction[];
  disclaimer?: string;
  detectedLanguage: string;
  intent: string;
}

const DISCLAIMER: Record<string, string> = {
  en: 'Official NSFDC Concessional Scheme Guidelines. Final eligibility and sanction are subject to document verification by the authorized Channel Partner.',
  hi: 'आधिकारिक NSFDC रियायती योजना दिशानिर्देश। अंतिम पात्रता और ऋण स्वीकृति अधिकृत चैनल पार्टनर द्वारा दस्तावेज सत्यापन के अधीन है।',
  mr: 'अधिकृत NSFDC सवलत योजना मार्गदर्शक तत्त्वे. अंतिम पात्रता आणि कर्ज मंजुरी अधिकृत चॅनेल भागीदाराद्वारे कागदपत्र पडताळणीच्या अधीन आहे.',
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
  userContext?: { name?: string | null; salary?: number | null }
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
  const userInfoPrompt = (salaryNum != null || userContext?.name)
    ? `
AUTHENTICATED BENEFICIARY PROFILE & VERIFIED FINANCIAL DATA:
${userContext?.name ? `- Beneficiary Name: ${userContext.name}` : ''}
${salaryNum != null ? `- Verified Annual Income / Salary: ₹${salaryNum.toLocaleString('en-IN')} (verified from government records / registration).
- CRITICAL SALARY RULE: The beneficiary's annual salary/income is already on file and verified (₹${salaryNum.toLocaleString('en-IN')}). NEVER ask the user what their salary, earnings, or income is. Automatically use this figure when checking scheme eligibility (ceiling ≤ ₹5,00,000), assessing repayment affordability, or passing parameters to tools.` : ''}
`
    : '';

  return `
You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India). You help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, find channel partners, and understand documentation and application steps.
${userInfoPrompt}
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
- If you already have enough from earlier in the conversation (including any "Known context" note below), go ahead and call the tool — don't re-ask for something already given.
- Application process steps and general NSFDC background are safe to explain directly without a tool call — they aren't scheme-specific numbers.

STYLE:
- Warmly acknowledge the user's business idea, educational goal, or situation.
- Never say "Based on your profile" or "you are eligible" before real data confirms it — say "for this purpose..." or "based on what you've shared...".
- Keep replies concise, warm, and clear (a few sentences, not an essay), in ${langName}.
- Do not mention tool names, JSON, or internal mechanics to the user.
- Write in plain conversational prose only, like a person speaking — NEVER use Markdown formatting of any kind: no "#" or "##" headings, no "**bold**", no tables or "|" pipes, no "---" horizontal rules, no bullet lists with "-" or "*", no numbered lists.
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

const MAX_TOOL_ROUNDS = 3;

export async function process(
  message: string,
  sessionId?: string,
  requestedLanguage?: string,
  detectedSpeechLanguage?: string,
  speechProbability?: number,
  category?: string,
  userContext?: { name?: string | null; salary?: number | null }
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

  session.conversationHistory.push({ role: 'user', content: message });

  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(session.language, category, effectiveUserContext) }];

  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: `Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): ${JSON.stringify(session.lastContext)}`,
    });
  }

  for (const turn of session.conversationHistory) {
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

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const assistantMsg = await llmChat({ messages, tools: TOOL_DEFS, maxTokens: 700 });

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        messages.push({ role: 'assistant', content: assistantMsg.content ?? null, tool_calls: assistantMsg.tool_calls });

        for (const call of assistantMsg.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            args = {};
          }

          // Pre-populate family_income_rs from verified user salary if not explicitly set
          if (call.function.name === 'recommend_schemes' && args.family_income_rs == null && effectiveUserContext?.salary != null) {
            args.family_income_rs = Number(effectiveUserContext.salary);
          }

          const result = await executeTool(call.function.name, args);
          lastToolName = result.toolName;
          lastToolData = result.data;

          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result.data),
          });
        }
        continue; // let the model produce the grounded explanation (or another tool call) next round
      }

      finalText = assistantMsg.content || '';
      break;
    }
} catch (llmErr) {
    console.warn('[ChatOrchestrator] LLM call fallback triggered:', (llmErr as Error)?.message);
    const fallbackResult = await executeTool('recommend_schemes', { query: message });
    lastToolName = fallbackResult.toolName;
    lastToolData = fallbackResult.data;
    finalText = session.language === 'hi'
      ? 'आपकी आवश्यकता के अनुसार उपयुक्त योजनाएं नीचे प्रदर्शित की गई हैं।'
      : session.language === 'mr'
      ? 'तुमच्या गरजेनुसार योग्य योजना खाली दाखवल्या आहेत.'
      : 'Here are the recommended schemes matching your inquiry.';
  }

  if (!finalText) {
    finalText =
      session.language === 'hi'
        ? 'क्षमा करें, कृपया अपना प्रश्न दोबारा बताएं।'
        : session.language === 'mr'
        ? 'माफ करा, कृपया तुमचा प्रश्न पुन्हा सांगा.'
        : "Sorry, could you rephrase that for me?";
  }

  finalText = stripMarkdown(finalText);

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
    type,
    data: lastToolData,
    quickActions: QUICK_ACTIONS[type],
    disclaimer: type === 'schemes' ? (DISCLAIMER[session.language] || DISCLAIMER.en) : undefined,
    detectedLanguage: session.language,
    intent,
  };

  return response;
}
