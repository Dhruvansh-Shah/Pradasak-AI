import { API_BASE } from './apiBase';

export const API_URL = API_BASE;
const BASE = API_BASE;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatResponse {
  sessionId: string;
  chatId?: string;
  message: string;
  type: 'text' | 'schemes' | 'emi' | 'partners' | 'comparison' | 'documents' | 'question';
  data?: Record<string, unknown>;
  quickActions?: { label: string; labelHi: string; message: string }[];
  disclaimer?: string;
  detectedLanguage: string;
  intent: string;
  speechText?: string;
}

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  phone: string;
  salary?: number | null;
  created_at: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  type: string;
  data: Record<string, unknown> | null;
  quick_actions: { label: string; labelHi: string; message: string }[] | null;
  disclaimer: string | null;
  created_at: string;
  speechText?: string;
  speech_text?: string;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function userHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export interface Scheme {
  id: number;
  name: string;
  category?: string;
  max_loan_lakh?: number;
  interest_rate?: number;
  tenure_months?: number;
  moratorium_months?: number;
  eligibility_summary?: string;
  mandatory_documents?: string[];
  conditional_documents?: string[];
  [key: string]: unknown;
}

export interface SchemeActionPayload {
  action: 'KNOW_MORE' | 'DOCUMENTS' | 'EMI' | 'COMPARE';
  schemeId?: number;
  schemeName?: string;
  schemeIds?: number[];
  schemeNames?: string[];
}

export async function sendChat(
  message: string,
  sessionId?: string,
  chatId?: string,
  token?: string | null,
  language?: string,
  detectedLanguageCode?: string | null,
  languageProbability?: number | null,
  category?: string | null,
  schemeAction?: SchemeActionPayload,
  history?: { role: 'user' | 'assistant'; content: string }[]
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: userHeaders(token),
    body: JSON.stringify({
      message,
      sessionId,
      chatId,
      language,
      detectedLanguageCode,
      languageProbability,
      category,
      schemeAction,
      history,
    }),
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    const err = await res.json().catch(() => ({ error: 'Network error' })) as { error?: string; detail?: string };
    throw new Error(err.detail || err.error || 'Chat request failed');
  }
  return res.json() as Promise<ChatResponse>;
}

export async function fetchSchemes(): Promise<any[]> {
  const res = await fetch(`${BASE}/schemes`);
  if (!res.ok) throw new Error('Failed to fetch schemes');
  return res.json();
}

export async function fetchSchemeById(id: number): Promise<any> {
  const res = await fetch(`${BASE}/schemes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch scheme');
  return res.json();
}

export async function compareSchemesApi(ids: number[]): Promise<any[]> {
  const res = await fetch(`${BASE}/schemes/compare?ids=${ids.join(',')}`);
  if (!res.ok) throw new Error('Failed to compare schemes');
  return res.json();
}

// ── Text-to-Speech (TTS) ──────────────────────────────────────────────────────

export async function fetchTTS(text: string, language: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'TTS request failed' }))) as { error?: string; detail?: string };
    throw new Error(err.detail || err.error || 'TTS request failed');
  }
  return res.blob();
}

// ── Speech-to-Text (STT) ──────────────────────────────────────────────────────

export async function transcribeAudio(
  audioBlob: Blob,
  language: string = 'unknown'
): Promise<{
  transcript: string;
  detectedLanguageCode: string | null;
  languageProbability: number | null;
}> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);

  const res = await fetch(`${BASE}/stt`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'STT request failed' }))) as {
      error?: string;
      detail?: string;
    };
    throw new Error(err.detail || err.error || 'STT request failed');
  }

  return res.json() as Promise<{
    transcript: string;
    detectedLanguageCode: string | null;
    languageProbability: number | null;
  }>;
}

// ── User auth ─────────────────────────────────────────────────────────────────

export async function userRegister(data: {
  name?: string; email: string; phone: string; password: string; salary?: number;
}): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' })) as { error: string };
    throw new Error(err.error);
  }
  return res.json() as Promise<{ token: string; user: UserProfile }>;
}

export async function userLogin(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' })) as { error: string };
    throw new Error(err.error);
  }
  return res.json() as Promise<{ token: string; user: UserProfile }>;
}

export async function forgotPasswordSendOtp(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/users/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({ error: 'Failed to send OTP' }));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
}

export async function forgotPasswordVerifyOtp(email: string, otp: string): Promise<{ success: boolean; resetToken: string; message: string }> {
  const res = await fetch(`${BASE}/users/forgot-password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => ({ error: 'OTP verification failed' }));
  if (!res.ok) {
    throw new Error(data.error || 'OTP verification failed');
  }
  return data;
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
  confirmPassword?: string
): Promise<{ success: boolean; message: string; token: string; user: UserProfile }> {
  const res = await fetch(`${BASE}/users/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  });
  const data = await res.json().catch(() => ({ error: 'Failed to reset password' }));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
  return data;
}


export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/users/me`, { headers: userHeaders(token) });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    throw new Error('Not authenticated');
  }
  return res.json() as Promise<UserProfile>;
}

// ── Chat history ──────────────────────────────────────────────────────────────

export async function listChats(token: string): Promise<ChatSummary[]> {
  const res = await fetch(`${BASE}/chats`, { headers: userHeaders(token) });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    throw new Error('Failed to load chats');
  }
  return res.json() as Promise<ChatSummary[]>;
}

export async function getChat(id: string, token: string): Promise<{ chat: ChatSummary; messages: ChatMessage[] }> {
  const res = await fetch(`${BASE}/chats/${id}`, { headers: userHeaders(token) });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    throw new Error('Chat not found');
  }
  return res.json() as Promise<{ chat: ChatSummary; messages: ChatMessage[] }>;
}

export async function deleteChat(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/chats/${id}`, { method: 'DELETE', headers: userHeaders(token) });
  if (!res.ok) throw new Error('Failed to delete chat');
}

export async function importGuestChat(
  clientChatId: string,
  messages: Array<{
    role: 'user' | 'assistant';
    content?: string;
    text?: string;
    type?: string;
    data?: Record<string, unknown>;
    quickActions?: unknown;
    quick_actions?: unknown;
    disclaimer?: string;
    speechText?: string;
  }>,
  token: string,
  title?: string
): Promise<{ id: string; title: string; ok: boolean; alreadyImported?: boolean }> {
  const res = await fetch(`${BASE}/chats/import`, {
    method: 'POST',
    headers: userHeaders(token),
    body: JSON.stringify({ clientChatId, messages, title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to import chat' }));
    throw new Error(err.error || 'Failed to import chat');
  }
  return res.json();
}

export async function shareChat(
  id: string,
  token: string
): Promise<{ ok: boolean; shareId: string; chatId: string }> {
  const res = await fetch(`${BASE}/chats/${id}/share`, {
    method: 'POST',
    headers: userHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to share chat' }));
    throw new Error(err.error || 'Failed to share chat');
  }
  return res.json();
}

export async function getSharedChat(
  shareId: string
): Promise<{
  chat: { title: string; created_at: string };
  messages: ChatMessage[];
}> {
  const res = await fetch(`${BASE}/chats/shared/${encodeURIComponent(shareId)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Shared conversation not found' }));
    throw new Error(err.error || 'Shared conversation not found');
  }
  return res.json();
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string): Promise<{ token: string; email: string }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' })) as { error: string };
    throw new Error(err.error);
  }
  return res.json() as Promise<{ token: string; email: string }>;
}

function adminHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function adminGetSchemes(token: string) {
  const res = await fetch(`${BASE}/admin/schemes`, { headers: adminHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch schemes');
  return res.json() as Promise<unknown[]>;
}

export async function adminToggleScheme(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/schemes/${id}/toggle`, { method: 'PATCH', headers: adminHeaders(token) });
  if (!res.ok) throw new Error('Failed to toggle scheme');
  return res.json();
}

export async function adminGetPartners(token: string) {
  const res = await fetch(`${BASE}/admin/partners`, { headers: adminHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch partners');
  return res.json() as Promise<unknown[]>;
}

export async function adminTogglePartner(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/partners/${id}/toggle`, { method: 'PATCH', headers: adminHeaders(token) });
  if (!res.ok) throw new Error('Failed to toggle partner');
  return res.json();
}

export async function adminGetStats(token: string) {
  const res = await fetch(`${BASE}/admin/stats`, { headers: adminHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json() as Promise<{ schemes: { total: number; active: number }; partners: { total: number; active: number } }>;
}

// ── Legacy stubs (old components only) ───────────────────────────────────────

export async function emiChat(_message: string, _history: object[] = []) {
  throw new Error('Use sendChat instead');
}

export async function recommendSchemes(_message: string, _history: object[] = []) {
  throw new Error('Use sendChat instead');
}

export async function chatRecommend(_message: string, _history: object[] = []) {
  throw new Error('Use sendChat instead');
}

// ── Legacy endpoints ──────────────────────────────────────────────────────────

export async function emiCalculate(params: {
  principalLakh: number;
  annualRatePercent: number;
  tenureMonths: number;
  moratoriumMonths?: number;
}) {
  const res = await fetch(`${BASE}/emi/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function findPartners(lat: number, lng: number, category?: string, radiusKm?: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    ...(category && { category }),
    ...(radiusKm && { radiusKm: String(radiusKm) }),
  });
  const res = await fetch(`${BASE}/partners/nearby?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
