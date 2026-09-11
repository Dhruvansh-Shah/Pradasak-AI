const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterError extends Error {
  public readonly status: number;
  public readonly isCreditError: boolean;
  public readonly isRateLimit: boolean;
  public readonly isServerError: boolean;

  constructor(status: number, rawMessage: string) {
    const apiKeyPattern = /sk-[a-zA-Z0-9_-]{10,}/g;
    const sanitizedMsg = rawMessage.replace(apiKeyPattern, '[REDACTED]');
    super(`OpenRouter error ${status}: ${sanitizedMsg}`);
    this.name = 'OpenRouterError';
    this.status = status;
    this.isCreditError = status === 402 || /credit|afford|insufficient|balance/i.test(sanitizedMsg);
    this.isRateLimit = status === 429;
    this.isServerError = status >= 500;
  }
}

async function executeOpenRouterRequest(
  body: Record<string, unknown>,
  timeoutMs: number = 25000
): Promise<{ ok: boolean; status: number; text: string; data?: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sih-channel-finance.app',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {}

    return { ok: response.ok, status: response.status, text, data };
  } catch (err) {
    return { ok: false, status: 500, text: (err as Error)?.message || 'Network error' };
  }
}

export async function llmCall(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const initialModel = params.model || process.env.OPENROUTER_DEFAULT_MODEL || 'openrouter/free';
  const initialTokens = Math.min(params.maxTokens ?? 180, 180);

  const baseBody = {
    model: initialModel,
    max_tokens: initialTokens,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
    ...(params.jsonMode && { response_format: { type: 'json_object' } }),
  };

  let res = await executeOpenRouterRequest(baseBody);

  // 1. If credit error with specific affordable tokens limit, retry with reduced tokens
  if (!res.ok && res.status === 402 && initialModel !== 'openrouter/free') {
    const affordMatch = res.text.match(/can only afford (\d+)/i);
    if (affordMatch) {
      const reducedTokens = Math.max(100, parseInt(affordMatch[1], 10) - 20);
      res = await executeOpenRouterRequest({ ...baseBody, max_tokens: reducedTokens });
    }
  }

  // 2. If still failing (or 402/429/404), try targeted reliable free models
  const fallbackModels = [
    'nvidia/nemotron-3.5-lightning:free',
    'nex-agi/nex-n2.5-mini:free',
    'inclusionai/ling-3.0-flash-vl:free',
    'openrouter/free',
  ];

  if (!res.ok && !fallbackModels.includes(initialModel)) {
    for (const fbModel of fallbackModels) {
      console.warn(`[OpenRouter] Trying fallback model ${fbModel} after status ${res.status}...`);
      res = await executeOpenRouterRequest({
        ...baseBody,
        model: fbModel,
        max_tokens: 350,
      });
      if (res.ok) break;
    }
  }

  if (!res.ok) {
    throw new OpenRouterError(res.status, res.text);
  }

  return res.data.choices[0].message.content;
}

// ── Multi-turn / tool-calling support ─────────────────────────────────────────
// Used by the chat orchestrator's single agentic loop: one conversation where
// the model itself decides when it needs real data (via tool calls) instead
// of us pre-classifying intent or pre-extracting entities with keywords/regex.

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AssistantMessage {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
}

export async function llmChat(params: {
  model?: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  maxTokens?: number;
}): Promise<AssistantMessage> {
  const initialModel = params.model || process.env.OPENROUTER_STRONG_MODEL || process.env.OPENROUTER_DEFAULT_MODEL || 'openrouter/free';
  const initialTokens = Math.min(params.maxTokens ?? 700, 1024);

  const baseBody = {
    model: initialModel,
    max_tokens: initialTokens,
    messages: params.messages,
    ...(params.tools && params.tools.length > 0 ? { tools: params.tools, tool_choice: 'auto' } : {}),
  };

  let res = await executeOpenRouterRequest(baseBody);
  if (!res.ok) {
    console.warn(`[OpenRouter] initial model ${initialModel} returned ${res.status}:`, res.text);
  }

  // 1. If credit error with specific affordable tokens limit, retry with reduced tokens
  if (!res.ok && res.status === 402 && initialModel !== 'openrouter/free') {
    const affordMatch = res.text.match(/can only afford (\d+)/i);
    if (affordMatch) {
      const reducedTokens = Math.max(80, Math.min(parseInt(affordMatch[1], 10) - 20, 200));
      res = await executeOpenRouterRequest({ ...baseBody, max_tokens: reducedTokens });
    }
  }

  // 2. If still failing (or 402/429/404), try targeted reliable free models with tool support
  const fallbackModels = [
    'nvidia/nemotron-3.5-lightning:free',
    'nex-agi/nex-n2.5-mini:free',
    'inclusionai/ling-3.0-flash-vl:free',
    'openrouter/free',
  ];

  if (!res.ok && !fallbackModels.includes(initialModel)) {
    for (const fbModel of fallbackModels) {
      console.warn(`[OpenRouter] Trying fallback model ${fbModel} after status ${res.status}...`);
      res = await executeOpenRouterRequest({
        ...baseBody,
        model: fbModel,
        max_tokens: 280,
      });
      if (res.ok) break;
    }
  }

  if (!res.ok) {
    throw new OpenRouterError(res.status, res.text);
  }

  const rawMessage = res.data?.choices?.[0]?.message;
  if (!rawMessage) {
    return { role: 'assistant', content: null };
  }

  // Sanitize content from reasoning models that leak thinking tags
  let content = rawMessage.content;
  if (content) {
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (/here['’]s a thinking process/i.test(content) || /thinking process:/i.test(content)) {
      const paragraphs = content.split(/\n\s*\n/);
      const filtered = paragraphs.filter(
        (p: string) =>
          !/thinking process/i.test(p) &&
          !/analyze user/i.test(p) &&
          !/identify key/i.test(p) &&
          !/parameters for/i.test(p) &&
          !/actually, the tool/i.test(p) &&
          !/let's check/i.test(p)
      );
      content = filtered.join('\n\n').trim();
    }
  }

  return {
    role: rawMessage.role || 'assistant',
    content: content || null,
    tool_calls: rawMessage.tool_calls,
  };
}


