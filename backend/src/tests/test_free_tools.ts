import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { TOOL_DEFS } from '../services/Tools';

const candidates = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-vl:free',
  'nex-agi/nex-n2.5-mini:free',
  'nvidia/nemotron-3.5-lightning:free',
];

async function testModel(model: string) {
  console.log(`\nTesting ${model}...`);
  const start = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sih-channel-finance.app',
      },
      body: JSON.stringify({
        model,
        max_tokens: 150,
        messages: [
          { role: 'system', content: 'You are PradarshakAI. Output user text only, never reasoning.' },
          { role: 'user', content: 'suggest me some good educational scheme' }
        ],
        tools: TOOL_DEFS,
        tool_choice: 'auto'
      }),
      signal: AbortSignal.timeout(8000)
    });
    const duration = Date.now() - start;
    console.log(`[${model}] Status: ${res.status} (${duration}ms)`);
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    console.log(`[${model}] Tool calls:`, msg?.tool_calls ? JSON.stringify(msg.tool_calls) : 'NONE');
    console.log(`[${model}] Content:`, msg?.content?.slice(0, 100));
  } catch (err: any) {
    console.log(`[${model}] Failed: ${err.message}`);
  }
}

async function run() {
  for (const m of candidates) {
    await testModel(m);
  }
}
run().catch(console.error);
