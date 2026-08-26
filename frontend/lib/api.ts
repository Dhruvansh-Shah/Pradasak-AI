const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
}

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  phone: string;
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
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function userHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendChat(
  message: string,
  sessionId?: string,
  chatId?: string,
  token?: string | null
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: userHeaders(token),
    body: JSON.stringify({ message, sessionId, chatId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' })) as { error: string };
    throw new Error(err.error || 'Chat request failed');
  }
  return res.json() as Promise<ChatResponse>;
}

// ── User auth ─────────────────────────────────────────────────────────────────

export async function userRegister(data: {
  name?: string; email: string; phone: string; password: string;
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

export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/users/me`, { headers: userHeaders(token) });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json() as Promise<UserProfile>;
}

// ── Chat history ──────────────────────────────────────────────────────────────

export async function listChats(token: string): Promise<ChatSummary[]> {
  const res = await fetch(`${BASE}/chats`, { headers: userHeaders(token) });
  if (!res.ok) throw new Error('Failed to load chats');
  return res.json() as Promise<ChatSummary[]>;
}

export async function getChat(id: string, token: string): Promise<{ chat: ChatSummary; messages: ChatMessage[] }> {
  const res = await fetch(`${BASE}/chats/${id}`, { headers: userHeaders(token) });
  if (!res.ok) throw new Error('Chat not found');
  return res.json() as Promise<{ chat: ChatSummary; messages: ChatMessage[] }>;
}

export async function deleteChat(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/chats/${id}`, { method: 'DELETE', headers: userHeaders(token) });
  if (!res.ok) throw new Error('Failed to delete chat');
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
