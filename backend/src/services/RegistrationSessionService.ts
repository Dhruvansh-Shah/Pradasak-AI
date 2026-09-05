export type VerificationStatus = 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';

export interface RegistrationSession {
  email: string;
  casteStatus: VerificationStatus;
  incomeStatus: VerificationStatus;
}

const sessions = new Map<string, RegistrationSession>();

export function getRegistrationSession(email: string): RegistrationSession {
  const normalized = email.toLowerCase().trim();
  if (!sessions.has(normalized)) {
    sessions.set(normalized, {
      email: normalized,
      casteStatus: 'PENDING',
      incomeStatus: 'PENDING'
    });
  }
  return sessions.get(normalized)!;
}

export function updateRegistrationSession(email: string, updates: Partial<RegistrationSession>) {
  const normalized = email.toLowerCase().trim();
  const session = getRegistrationSession(normalized);
  Object.assign(session, updates);
  sessions.set(normalized, session);
}

export function clearRegistrationSession(email: string) {
  const normalized = email.toLowerCase().trim();
  sessions.delete(normalized);
}
