import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { TOOL_DEFS } from '../services/Tools';

async function test() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sih-channel-finance.app',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are PradarshakAI, an expert AI advisor for National Scheduled Castes Finance and Development Corporation (NSFDC).
The user is Aryan Phanse, SC category, income 189525, location Pune.
Always call tools when asked about schemes, loans, documents, emi, partners. Never guess.`
        },
        { role: 'user', content: 'suggest me some good educational scheme' }
      ],
      tools: TOOL_DEFS,
      tool_choice: 'auto'
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
test().catch(console.error);
