import type { Language } from './IntentClassifier';

/**
 * UserEntities is kept as a shared shape for tool arguments (see Tools.ts) —
 * it's no longer populated by a separate extraction step here. Each turn,
 * the model reads the conversation itself and passes these fields directly
 * as tool call arguments when it needs real data.
 */
export interface UserEntities {
  loan_amount_rs?: number;        // in rupees
  family_income_rs?: number;      // annual, in rupees
  purpose?: string;               // e.g. 'tailoring', 'dairy', 'education'
  education_level?: string;
  course?: string;
  location?: string;              // city / district / PIN
  gender?: string;
  age?: number;
  scheme_names?: string[];        // schemes mentioned by user
  tenure_months?: number;
  interest_rate_pct?: number;
  social_category?: string;       // 'SC', 'ST', etc.
  scheme_id?: number;             // selected/recommended scheme
  moratorium_months?: number;
}

export interface UserProfileContext {
  name?: string | null;
  salary?: number | null;
  gender?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  education_level?: string | null;
  trade_category?: string | null;
  funding_bracket?: string | null;
  caste_category?: string | null;
}

export interface ConversationFacts {
  business_type?: string;        // e.g. 'tailoring', 'dairy', 'kirana', 'salon'
  purpose?: string;              // e.g. 'tailoring machine and small shop'
  loan_amount_rs?: number;       // e.g. 100000
  loan_amount_type?: 'exact' | 'approximate' | 'unknown';
  loan_amount_text?: string;     // e.g. '₹1 Lakh'
  family_income_rs?: number;     // annual in rupees
  location?: string;             // city/district
  gender?: string;
  category_hint?: string;        // 'business_loan' | 'education_loan' | 'general'
  education_level?: string;
  course?: string;
  last_recommended_schemes?: { name: string; code?: string; max_loan_lakh?: number }[];
  selected_scheme?: { name: string; code?: string; id?: number };
}

export interface Session {
  id: string;
  language: Language;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  knownFacts: ConversationFacts;
  /** Compact JSON snapshot of the most recent tool result(s), re-injected as
   *  context each turn so the model can refer to earlier real data (e.g. a
   *  previously recommended scheme) without needing the full tool-call trace. */
  lastContext?: Record<string, unknown>;
  lastIntent?: string;
  userContext?: UserProfileContext;
  createdAt: Date;
  updatedAt: Date;
}

const store = new Map<string, Session>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function extractAndUpdateFacts(
  currentFacts: ConversationFacts = {},
  message: string,
  userContext?: UserProfileContext
): ConversationFacts {
  const facts: ConversationFacts = { ...currentFacts };
  const lowerMsg = (message || '').toLowerCase();

  // 1. Seed from userContext if not already present
  if (userContext) {
    if (userContext.salary != null && facts.family_income_rs == null) {
      facts.family_income_rs = Number(userContext.salary);
    }
    if ((userContext.city || userContext.district) && !facts.location) {
      facts.location = userContext.district || userContext.city || undefined;
    }
    if (userContext.gender && !facts.gender) {
      facts.gender = userContext.gender.toLowerCase();
    }
    if (userContext.education_level && !facts.education_level) {
      facts.education_level = userContext.education_level;
    }
    if (userContext.trade_category && !facts.business_type) {
      facts.business_type = userContext.trade_category;
      if (!facts.category_hint) facts.category_hint = 'business_loan';
    }
  }

  // 2. Loan Amount Extraction with Correction & Approximation Detection
  // Matches: 1.5 lakh, 1 lakh, ₹1 lakh, 1 lac, 50,000, 50k, etc.
  const isCorrection = /actually|instead|rather|revised|changed my mind|correction|now i need|not \d+/i.test(lowerMsg);
  const isApproximate = /around|approx|approximately|about|maybe|nearly|estimated|just|rough/i.test(lowerMsg) ||
                        /whatever i can get/i.test(lowerMsg);

  // Pattern 1: X Lakh / Lac / L
  const lakhMatch = lowerMsg.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lakh|lac|l\b)/i) ||
                     lowerMsg.match(/(?:around|approx|about|just|need)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|l\b)?/i);

  // Pattern 2: Thousands / K
  const thousandMatch = lowerMsg.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:thousand|k\b)/i);

  // Pattern 3: Full rupee integer (e.g. ₹100000, 1,00,000, ₹1,50,000)
  const fullRupeeMatch = lowerMsg.match(/(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{2,3})+|\d{4,8})/i);

  let extractedAmount: number | undefined;
  let extractedAmountText: string | undefined;

  if (lakhMatch && lakhMatch[1]) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 100) {
      extractedAmount = Math.round(val * 100000);
      extractedAmountText = `₹${val} Lakh`;
    }
  } else if (thousandMatch && thousandMatch[1]) {
    const val = parseFloat(thousandMatch[1]);
    if (!isNaN(val) && val > 0) {
      extractedAmount = Math.round(val * 1000);
      extractedAmountText = `₹${val} Thousand`;
    }
  } else if (fullRupeeMatch && fullRupeeMatch[1]) {
    const cleanStr = fullRupeeMatch[1].replace(/,/g, '');
    const val = parseInt(cleanStr, 10);
    if (!isNaN(val) && val >= 5000 && val <= 50000000) {
      extractedAmount = val;
      extractedAmountText = val >= 100000 ? `₹${(val / 100000).toFixed(1)} Lakh` : `₹${val.toLocaleString('en-IN')}`;
    }
  }

  // Update loan amount if extracted (or if user corrects previous amount)
  if (extractedAmount !== undefined) {
    facts.loan_amount_rs = extractedAmount;
    facts.loan_amount_text = extractedAmountText;
    facts.loan_amount_type = isApproximate ? 'approximate' : 'exact';
  }

  // 3. Business / Trade Category Extraction
  if (/tailor|tailoring|sewing|boutique|garment|cloth|सिलाई|शिलाई/i.test(lowerMsg)) {
    facts.business_type = 'tailoring';
    facts.category_hint = 'business_loan';
  } else if (/dairy|cattle|cow|buffalo|milk|farming|agriculture|खेती|डेयरी|पशुपालन/i.test(lowerMsg)) {
    facts.business_type = 'dairy & animal husbandry';
    facts.category_hint = 'business_loan';
  } else if (/grocery|kirana|general store|shop|dukaan|retail|व्यापार|दुकान/i.test(lowerMsg)) {
    if (!facts.business_type) {
      facts.business_type = 'retail shop / kirana';
      facts.category_hint = 'business_loan';
    }
  } else if (/salon|parlour|beauty|barber/i.test(lowerMsg)) {
    facts.business_type = 'salon & beauty parlour';
    facts.category_hint = 'business_loan';
  } else if (/sanitation|cleaning|safai|waste/i.test(lowerMsg)) {
    facts.business_type = 'sanitation services';
    facts.category_hint = 'business_loan';
  } else if (/rickshaw|auto|ev|transport|driver/i.test(lowerMsg)) {
    facts.business_type = 'transport / e-rickshaw';
    facts.category_hint = 'business_loan';
  } else if (/education|college|school|university|b\.?tech|m\.?tech|mbbs|degree|course|vocational|fees/i.test(lowerMsg)) {
    // Education intent detected — override any prior business context
    facts.category_hint = 'education_loan';
    // Clear business_type so it doesn't contaminate education queries
    if (facts.business_type) {
      console.log(`[CONTEXT] Intent switch: clearing business_type="${facts.business_type}" → education_loan`);
      delete facts.business_type;
      delete facts.purpose;
    }
  }

  // 4. Purpose Detail Extraction with Correction Support
  // Handle purpose correction: "not opening a shop anymore; only buying a tailoring machine"
  const notOpeningShop = /not\s+(?:opening|starting|taking|setting up)?\s*(?:a\s+)?(?:little\s+|small\s+)?shop/i.test(lowerMsg);
  const onlyMachine = /only\s+(?:buying|getting|need)?\s*(?:a\s+)?(?:tailoring|sewing)?\s*machine/i.test(lowerMsg);

  if (notOpeningShop || onlyMachine) {
    if (facts.business_type === 'tailoring' || /tailor|machine|sewing/i.test(lowerMsg)) {
      facts.purpose = 'tailoring machine';
    }
  } else {
    const hasMachine = /tailoring machine|sewing machine|machine/i.test(lowerMsg);
    const hasShop = /little shop|small shop|shop|store|dukaan/i.test(lowerMsg);

    if (hasMachine && hasShop) {
      facts.purpose = 'tailoring machine and small shop';
    } else if (hasMachine && !facts.purpose) {
      facts.purpose = 'tailoring machine';
    } else if (hasShop && !facts.purpose) {
      facts.purpose = facts.business_type ? `${facts.business_type} shop` : 'small shop';
    } else if (!facts.purpose && facts.business_type) {
      facts.purpose = `${facts.business_type} business setup`;
    }
  }

  // 5. Explicit Income Mention in conversation
  const incomeMatch = lowerMsg.match(/(?:my\s+)?(?:family\s+)?(?:annual\s+)?income\s+(?:is|of|around)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|l\b)/i) ||
                      lowerMsg.match(/(?:my\s+)?salary\s+(?:is|of)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|l\b)/i);
  if (incomeMatch && incomeMatch[1]) {
    const val = parseFloat(incomeMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 50) {
      facts.family_income_rs = Math.round(val * 100000);
    }
  }

  return facts;
}

export function getOrCreate(sessionId?: string): Session {
  if (sessionId && store.has(sessionId)) {
    const s = store.get(sessionId)!;
    s.updatedAt = new Date();
    if (!s.knownFacts) s.knownFacts = {};
    return s;
  }

  const session: Session = {
    id: sessionId || generateId(),
    language: 'unknown',
    conversationHistory: [],
    knownFacts: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(session.id, session);
  return session;
}

export function hydrateSessionHistory(
  session: Session,
  history: { role: 'user' | 'assistant'; content: string }[],
  userContext?: UserProfileContext
): void {
  if (!history || !Array.isArray(history) || history.length === 0) return;
  if (session.conversationHistory.length === 0) {
    for (const turn of history) {
      session.conversationHistory.push({ role: turn.role, content: turn.content });
      if (turn.role === 'user') {
        session.knownFacts = extractAndUpdateFacts(session.knownFacts || {}, turn.content, userContext);
      }
    }
  }
}

export function updateSession(session: Session): void {
  session.updatedAt = new Date();
  store.set(session.id, session);
}

// Cleanup expired sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of store.entries()) {
    if (now - s.updatedAt.getTime() > TTL_MS) store.delete(id);
  }
}, 15 * 60 * 1000);

