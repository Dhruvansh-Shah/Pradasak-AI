import type { Language } from './IntentClassifier';

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

export interface Session {
  id: string;
  language: Language;
  entities: UserEntities;
  recommendedSchemes?: Record<string, unknown>[];
  selectedScheme?: Record<string, unknown>;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  lastIntent?: string;
  pendingQuestion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const store = new Map<string, Session>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreate(sessionId?: string): Session {
  if (sessionId && store.has(sessionId)) {
    const s = store.get(sessionId)!;
    s.updatedAt = new Date();
    return s;
  }

  const session: Session = {
    id: sessionId || generateId(),
    language: 'unknown',
    entities: {},
    conversationHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(session.id, session);
  return session;
}

export function updateSession(session: Session): void {
  session.updatedAt = new Date();
  store.set(session.id, session);
}

/** Merge new entities into session, never overwriting with null/undefined */
export function mergeEntities(session: Session, incoming: Partial<UserEntities>): void {
  for (const [k, v] of Object.entries(incoming)) {
    if (v !== null && v !== undefined) {
      (session.entities as Record<string, unknown>)[k] = v;
    }
  }
}

// Cleanup expired sessions every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of store.entries()) {
    if (now - s.updatedAt.getTime() > TTL_MS) store.delete(id);
  }
}, 15 * 60 * 1000);
