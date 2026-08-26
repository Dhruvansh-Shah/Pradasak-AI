import { llmCall } from '../lib/openrouter';
import type { UserEntities } from './ConversationSession';

const SYSTEM_PROMPT = `
You are a financial entity extractor for Indian government SC loan schemes.
Extract structured data from the user message and return ONLY valid JSON.
Convert all money to rupees (₹). "2 lakh" = 200000. "50000" = 50000.
Fields (use null for anything not mentioned):
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

export async function extractEntities(message: string): Promise<Partial<UserEntities>> {
  try {
    const raw = await llmCall({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: message,
      jsonMode: true,
      maxTokens: 256,
    });

    const parsed = JSON.parse(raw) as Partial<UserEntities & { scheme_names: string[] }>;

    // Filter nulls
    const result: Partial<UserEntities> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== undefined) {
        (result as Record<string, unknown>)[k] = v;
      }
    }
    return result;
  } catch {
    return {};
  }
}
