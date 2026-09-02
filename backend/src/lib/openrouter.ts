const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function llmCall(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const model = params.model || process.env.OPENROUTER_DEFAULT_MODEL || 'openrouter/free';

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sih-channel-finance.app',
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      ...(params.jsonMode && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
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
  const model = params.model || process.env.OPENROUTER_STRONG_MODEL || process.env.OPENROUTER_DEFAULT_MODEL || 'openrouter/free';

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sih-channel-finance.app',
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 1024,
      messages: params.messages,
      ...(params.tools && params.tools.length > 0 ? { tools: params.tools, tool_choice: 'auto' } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json() as { choices: { message: AssistantMessage }[] };
  return data.choices[0].message;
}

