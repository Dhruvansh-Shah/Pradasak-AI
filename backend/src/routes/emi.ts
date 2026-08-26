import { Router, Request, Response } from 'express';
import { llmCall } from '../lib/openrouter';

const router = Router();

// Standard EMI formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
function calculateEMI(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (annualRatePercent === 0) return principal / tenureMonths;
  const r = annualRatePercent / 100 / 12;
  const n = tenureMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function buildAmortization(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
  moratoriumMonths: number
): { month: number; emi: number; principal: number; interest: number; balance: number }[] {
  const r = annualRatePercent / 100 / 12;
  const schedule = [];
  let balance = principal;

  // During moratorium: interest accrues, capitalised into principal at end of moratorium
  if (moratoriumMonths > 0) {
    for (let m = 1; m <= moratoriumMonths; m++) {
      const interest = balance * r;
      balance += interest;
      schedule.push({ month: m, emi: 0, principal: 0, interest: parseFloat(interest.toFixed(2)), balance: parseFloat(balance.toFixed(2)) });
    }
  }

  const emi = calculateEMI(balance, annualRatePercent, tenureMonths);
  for (let m = moratoriumMonths + 1; m <= moratoriumMonths + tenureMonths; m++) {
    const interest = balance * r;
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      month: m,
      emi: parseFloat(emi.toFixed(2)),
      principal: parseFloat(principalPaid.toFixed(2)),
      interest: parseFloat(interest.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
    });
  }

  return schedule;
}

const EMI_ADVISOR_SYSTEM_PROMPT = `
You are a friendly financial advisor helping a beneficiary understand their loan repayment options.

When the user describes their situation, ask clarifying questions or suggest tenor/moratorium trade-offs.
When you have enough information (loan amount, interest rate, tenure, moratorium), respond with a JSON object:
{
  "ready": true,
  "principal": <number in Lakhs>,
  "annualRatePercent": <number>,
  "tenureMonths": <number, repayment period EXCLUDING moratorium>,
  "moratoriumMonths": <number, 0 if none>,
  "explanation": "<brief explanation of your recommendation>"
}

If you need more information, respond with:
{
  "ready": false,
  "question": "<your clarifying question in the user's language>"
}

Always respond in the same language the user uses.
Interest rates for government schemes are typically 3.5%–8% for concessional and up to 15% for others.
Moratorium is 0–12 months depending on scheme.
`.trim();

// POST /api/emi/calculate
// Direct calculation with known parameters
router.post('/calculate', (req: Request, res: Response) => {
  const { principalLakh, annualRatePercent, tenureMonths, moratoriumMonths = 0 } = req.body as {
    principalLakh: number;
    annualRatePercent: number;
    tenureMonths: number;
    moratoriumMonths?: number;
  };

  if (!principalLakh || !annualRatePercent || !tenureMonths) {
    res.status(400).json({ error: 'principalLakh, annualRatePercent, and tenureMonths are required' });
    return;
  }

  const principal = principalLakh * 100000;
  const emi = calculateEMI(principal, annualRatePercent, tenureMonths);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;
  const schedule = buildAmortization(principal, annualRatePercent, tenureMonths, moratoriumMonths);

  res.json({
    emi: parseFloat(emi.toFixed(2)),
    totalPayable: parseFloat(totalPayable.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    schedule,
  });
});

// POST /api/emi/chat
// Conversational advisor — LLM extracts parameters, code computes, LLM explains
router.post('/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory = [], scheme } = req.body as {
    message: string;
    conversationHistory: { role: string; content: string }[];
    scheme?: object;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const contextNote = scheme
    ? `\nThe user has already been recommended the following scheme — use its rate/moratorium ranges as defaults:\n${JSON.stringify(scheme)}`
    : '';

  try {
    const rawReply = await llmCall({
      model: process.env.OPENROUTER_STRONG_MODEL,
      systemPrompt: EMI_ADVISOR_SYSTEM_PROMPT + contextNote,
      userMessage: [
        ...conversationHistory.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`),
        `User: ${message}`,
      ].join('\n'),
      jsonMode: true,
      maxTokens: 512,
    });

    let parsed: { ready: boolean; question?: string; principal?: number; annualRatePercent?: number; tenureMonths?: number; moratoriumMonths?: number; explanation?: string };
    try {
      parsed = JSON.parse(rawReply);
    } catch {
      res.status(500).json({ error: 'Failed to parse advisor response', raw: rawReply });
      return;
    }

    if (!parsed.ready) {
      res.json({
        ready: false,
        question: parsed.question,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: parsed.question || '' },
        ],
      });
      return;
    }

    // Parameters extracted — compute in code
    const principal = (parsed.principal || 0) * 100000;
    const rate = parsed.annualRatePercent || 0;
    const tenure = parsed.tenureMonths || 0;
    const moratorium = parsed.moratoriumMonths || 0;

    const emi = calculateEMI(principal, rate, tenure);
    const totalPayable = emi * tenure;
    const totalInterest = totalPayable - principal;
    const schedule = buildAmortization(principal, rate, tenure, moratorium);

    const summaryMessage = `EMI: ₹${emi.toFixed(0)}/month for ${tenure} months. Total interest: ₹${totalInterest.toFixed(0)}. ${parsed.explanation || ''}`;

    res.json({
      ready: true,
      emi: parseFloat(emi.toFixed(2)),
      totalPayable: parseFloat(totalPayable.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      params: { principal, annualRatePercent: rate, tenureMonths: tenure, moratoriumMonths: moratorium },
      schedule,
      explanation: parsed.explanation,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: summaryMessage },
      ],
    });
  } catch (err) {
    console.error('EMI chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
