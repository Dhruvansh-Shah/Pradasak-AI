import { llmCall } from '../lib/openrouter';
import type { UserEntities } from './ConversationSession';

const SYSTEM_PROMPT = `
You are a precise financial entity extractor for Indian government SC concessional loan schemes (NSFDC).
Extract structured user requirements from the user's message (considering recent conversation context if provided) and return ONLY valid JSON.

Rules for Amount Conversion:
- "5,00,000" or "5 lakh" or "5L" = 500000
- "10 lpa" or "10 LPA" or "10 lakh per annum" = 1000000 (annual family income)
- "2.5 lakh income" = 250000
- "50k" = 50000
- If user replies to numbered questions (e.g. "1 - 5,00,000  2 - 10 lpa" or "1 - purpose is... 2 - amravati"), resolve them according to what the assistant asked.
- Gender Extraction: If user indicates female/woman/girl/mother/wife/SHG or mentions "महिलाएं", "महिला", "स्त्री", "महिला समूह", "women", set "gender": "female". If male/man/boy/brother/husband/"पुरुष", set "gender": "male". Otherwise null.

JSON format (use null for fields not mentioned or unknown):
{
  "loan_amount_rs": <number|null>,
  "family_income_rs": <number|null>,
  "purpose": <string|null>,
  "education_level": <"school"|"diploma"|"undergraduate"|"postgraduate"|null>,
  "course": <string|null>,
  "location": <string|null>,
  "gender": <"male"|"female"|null>,
  "age": <number|null>,
  "scheme_names": <string[]|null>,
  "tenure_months": <number|null>,
  "interest_rate_pct": <number|null>,
  "social_category": <string|null>,
  "moratorium_months": <number|null>
}
`.trim();

export async function extractEntities(
  message: string,
  recentHistory?: { role: string; content: string }[]
): Promise<Partial<UserEntities>> {
  try {
    let contextStr = '';
    if (recentHistory && recentHistory.length > 0) {
      const recent = recentHistory.slice(-4);
      contextStr = `Recent Conversation Context:\n${recent.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\n`;
    }

    const userPrompt = `${contextStr}LATEST USER MESSAGE:\n"${message}"`;

    const raw = await llmCall({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: userPrompt,
      jsonMode: true,
      maxTokens: 350,
    });

    const parsed = JSON.parse(raw) as Partial<UserEntities & { scheme_names: string[] }>;

    const result: Partial<UserEntities> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== undefined && v !== 'null') {
        (result as Record<string, unknown>)[k] = v;
      }
    }

    // Deterministic authority for explicit gender mentions
    if (/(\b(women|woman|female|girl|mother|wife|shg|ladies)\b|महिला|महिलाएं|स्त्री|महिला समूह)/i.test(message)) {
      result.gender = 'female';
    } else if (/(\b(man|male|boy|brother|husband|gents)\b|पुरुष|आदमी)/i.test(message)) {
      result.gender = 'male';
    }

    return result;
  } catch {
    const fallback: Partial<UserEntities> = {};
    if (/(\b(women|woman|female|girl|mother|wife|shg|ladies)\b|महिला|महिलाएं|स्त्री|महिला समूह)/i.test(message)) {
      fallback.gender = 'female';
    }
    return fallback;
  }
}
