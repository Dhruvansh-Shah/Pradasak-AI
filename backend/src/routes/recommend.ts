import { Router, Request, Response } from 'express';
import { readonlyPool } from '../db/pool';
import { llmCall } from '../lib/openrouter';

const router = Router();

// ── Filter extraction ─────────────────────────────────────────────────────────

const FILTER_EXTRACTION_SYSTEM_PROMPT = `
You are a financial intake assistant for Indian government loan schemes for Scheduled Caste beneficiaries.

Given the user's description (in any language), extract these fields:
{
  "income_lakh": <number | null>,           -- annual family income in Lakhs (e.g. 2.5)
  "project_type": <string | null>,          -- one keyword describing the business/project (e.g. "tailoring", "dairy", "education")
  "loan_amount_lakh": <number | null>,      -- desired loan amount in Lakhs if mentioned
  "education": <true | false>,              -- true if this is for education/vocational training
  "women_only": <true | false>,             -- true if the applicant is a woman asking for women-specific schemes
  "category_hint": <"micro_finance" | "term_loan" | "education_loan" | null>,
  "explanation": <string>                   -- one sentence: what you understood in the user's language
}

Return ONLY valid JSON with these exact keys. No extra text.
`.trim();

interface Filters {
  income_lakh: number | null;
  project_type: string | null;
  loan_amount_lakh: number | null;
  education: boolean;
  women_only: boolean;
  category_hint: 'micro_finance' | 'term_loan' | 'education_loan' | null;
  explanation: string;
}

async function extractFilters(message: string): Promise<Filters> {
  const raw = await llmCall({
    systemPrompt: FILTER_EXTRACTION_SYSTEM_PROMPT,
    userMessage: message,
    jsonMode: true,
    maxTokens: 256,
  });
  return JSON.parse(raw) as Filters;
}

// Build a safe parameterized query from extracted filters
function buildQuery(filters: Filters): { text: string; values: unknown[] } {
  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.income_lakh != null) {
    conditions.push(`max_income_lakh >= $${idx++}`);
    values.push(filters.income_lakh);
  }

  if (filters.education) {
    conditions.push(`education_required = TRUE`);
    conditions.push(`category = 'education_loan'`);
  } else if (filters.category_hint) {
    conditions.push(`category = $${idx++}`);
    values.push(filters.category_hint);
  }

  if (filters.loan_amount_lakh != null) {
    conditions.push(`max_loan_lakh >= $${idx++}`);
    values.push(filters.loan_amount_lakh);
  }

  if (filters.project_type) {
    conditions.push(`array_to_string(eligible_project_types, ',') ILIKE $${idx++}`);
    values.push(`%${filters.project_type}%`);
  }

  const text = `SELECT * FROM schemes WHERE ${conditions.join(' AND ')} ORDER BY interest_rate_min ASC LIMIT 5`;
  return { text, values };
}

// ── Explanation system prompt ──────────────────────────────────────────────────

const EXPLANATION_SYSTEM_PROMPT = `
You are a helpful financial advisor explaining Indian government loan schemes to a first-time SC beneficiary.

You will be given:
1. The user's request (in their original language)
2. A list of matching schemes from the database (as JSON)

For EACH scheme, explain:
- Why it fits the user's situation (2-3 sentences)
- 2 pros specific to the user
- 1-2 cons or things to watch out for

CRITICAL: Use ONLY the numbers from the scheme JSON — never invent interest rates, loan limits, or moratorium periods.
Respond in the SAME language the user used. Be simple, warm, and accessible.
`.trim();

// ── Safety check ──────────────────────────────────────────────────────────────

function isSafeSelectQuery(sql: string): boolean {
  const normalized = sql.trim().toLowerCase();
  if (!normalized.startsWith('select')) return false;
  const banned = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create', 'grant', 'exec', '--', ';'];
  return !banned.some((kw) => normalized.includes(kw));
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/recommend
router.post('/', async (req: Request, res: Response) => {
  const { message, conversationHistory = [] } = req.body as {
    message: string;
    conversationHistory?: { role: string; content: string }[];
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    // Step 1: Extract structured filters from user message
    const filters = await extractFilters(message);
    console.log('[recommend] Filters:', JSON.stringify(filters));

    // Step 2: Build and execute safe parameterized query
    const { text, values } = buildQuery(filters);
    console.log('[recommend] SQL:', text, '| Values:', values);

    if (!isSafeSelectQuery(text)) {
      res.status(500).json({ error: 'Query safety check failed' });
      return;
    }

    const dbResult = await readonlyPool.query(text, values);
    let schemes = dbResult.rows;

    // Fallback: if filters were too strict and returned nothing, return all schemes
    if (schemes.length === 0) {
      const fallback = await readonlyPool.query('SELECT * FROM schemes ORDER BY interest_rate_min ASC LIMIT 5');
      schemes = fallback.rows;
    }

    // Step 3: Grounded LLM explanation (uses strong model)
    const aiAnalysis = await llmCall({
      model: process.env.OPENROUTER_STRONG_MODEL,
      systemPrompt: EXPLANATION_SYSTEM_PROMPT,
      userMessage: `User's request: ${message}\n\nMatching schemes:\n${JSON.stringify(schemes, null, 2)}`,
      maxTokens: 1024,
    });

    res.json({
      schemes,
      explanation: filters.explanation,
      aiAnalysis,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: aiAnalysis },
      ],
    });
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    process.stdout.write(`[recommend-error] ${msg}\n${(err as Error)?.stack || ''}\n`);
    res.status(500).json({ error: 'Internal server error', detail: msg });
  }
});

// POST /api/recommend/chat
router.post('/chat', async (req: Request, res: Response) => {
  const { message, schemes, conversationHistory = [] } = req.body as {
    message: string;
    schemes: object[];
    conversationHistory: { role: string; content: string }[];
  };

  if (!message?.trim() || !schemes?.length) {
    res.status(400).json({ error: 'message and schemes are required' });
    return;
  }

  const systemPrompt = `
You are a financial advisor helping a Scheduled Caste beneficiary decide between government loan schemes.
The following schemes were retrieved from the database — use ONLY these numbers when discussing rates, limits, or terms. Never invent figures.
Schemes: ${JSON.stringify(schemes)}
Respond in the same language the user uses. Be concise and helpful.
`.trim();

  try {
    const reply = await llmCall({
      model: process.env.OPENROUTER_STRONG_MODEL,
      systemPrompt,
      userMessage: message,
      maxTokens: 768,
    });

    res.json({
      reply,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ],
    });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
