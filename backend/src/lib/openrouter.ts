const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function llmCall(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const model = params.model || process.env.OPENROUTER_DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct';

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
