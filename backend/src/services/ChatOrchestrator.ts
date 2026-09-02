import { detectLanguage } from './IntentClassifier';
import type { Language } from './IntentClassifier';
import { getOrCreate, updateSession } from './ConversationSession';
import type { Session } from './ConversationSession';
import { TOOL_DEFS, executeTool } from './Tools';
import { llmChat } from '../lib/openrouter';
import type { ChatMessage } from '../lib/openrouter';

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
  detectedLanguage: Language;
  intent: string;
}

const DISCLAIMER: Record<Language, string> = {
  en: 'Official NSFDC Concessional Scheme Guidelines. Final eligibility and sanction are subject to document verification by the authorized Channel Partner.',
  hi: 'आधिकारिक NSFDC रियायती योजना दिशानिर्देश। अंतिम पात्रता और ऋण स्वीकृति अधिकृत चैनल पार्टनर द्वारा दस्तावेज सत्यापन के अधीन है।',
  mr: 'अधिकृत NSFDC सवलत योजना मार्गदर्शक तत्त्वे. अंतिम पात्रता आणि कर्ज मंजुरी अधिकृत चॅनेल भागीदाराद्वारे कागदपत्र पडताळणीच्या अधीन आहे.',
  unknown: 'Official NSFDC Concessional Scheme Guidelines.',
};

const LANGUAGE_NAME: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  mr: 'Marathi (Devanagari script)',
  unknown: 'the same language the user is writing in',
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

function buildSystemPrompt(language: Language): string {
  return `
You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India). You help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, find channel partners, and understand documentation and application steps.

TOOLS & GROUNDING (critical):
- You have tools that return REAL data from the database and real financial math: recommend_schemes, calculate_emi, find_partners, get_required_documents, compare_schemes.
- NEVER invent or guess interest rates, loan limits, moratorium periods, EMI figures, partner names, addresses, or distances. Any time you need one of these, call the matching tool and use ONLY what it returns.
- If a tool needs information you don't have anywhere in this conversation, do NOT call it with a guessed value — instead, ask the user ONE short, warm, specific question to get exactly that missing piece, in ${LANGUAGE_NAME[language]}. Do not list multiple questions at once.
- If you already have enough from earlier in the conversation (including any "Known context" note below), go ahead and call the tool — don't re-ask for something already given.
- application process steps and general NSFDC background are safe to explain directly without a tool call — they aren't scheme-specific numbers.

STYLE:
- Warmly acknowledge the user's business idea, educational goal, or situation.
- Never say "Based on your profile" or "you are eligible" before real data confirms it — say "for this purpose..." or "based on what you've shared...".
- Keep replies concise, warm, and clear (a few sentences, not an essay), in ${LANGUAGE_NAME[language]}.
- Do not mention tool names, JSON, or internal mechanics to the user.
- Write in plain conversational prose only, like a person speaking — NEVER use Markdown formatting of any kind: no "#" or "##" headings, no "**bold**", no tables or "|" pipes, no "---" horizontal rules, no bullet lists with "-" or "*", no numbered lists. If you want to present several figures (loan amount, interest rate, tenure, etc.), weave them into normal sentences (e.g. "This scheme offers up to ₹27 lakh at 6–8% interest over 10 years, with a 6–12 month moratorium.") instead of a table or list. The chat interface renders plain text only, so any formatting symbols would show up as literal, ugly characters to the user.
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

const MAX_TOOL_ROUNDS = 3;

export async function process(message: string, sessionId?: string): Promise<ChatApiResponse> {
  const session: Session = getOrCreate(sessionId);

  // Cheap deterministic heuristic just to pick a reply language for the prompt —
  // no keyword-based intent/entity logic involved.
  const quickLang = detectLanguage(message);
  if (quickLang !== 'unknown') session.language = quickLang;

  session.conversationHistory.push({ role: 'user', content: message });

  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(session.language) }];

  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: `Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): ${JSON.stringify(session.lastContext)}`,
    });
  }

  for (const turn of session.conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  let lastToolName: string | null = null;
  let lastToolData: Record<string, unknown> | undefined;
  let finalText = '';

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
    disclaimer: type === 'schemes' ? DISCLAIMER[session.language] : undefined,
    detectedLanguage: session.language,
    intent,
  };

  return response;
}
