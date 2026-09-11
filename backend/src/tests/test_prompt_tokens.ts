import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { buildSystemPrompt } from '../services/ChatOrchestrator';

async function test() {
  const prompt = buildSystemPrompt('en', undefined, {
    name: 'Aryan Phanse',
    salary: 189525,
    location: 'Pune',
    district: 'Pune',
    city: 'Pune',
    gender: 'Male',
    trade_category: 'Education'
  });
  console.log('System prompt character length:', prompt.length);
  console.log('Approximate token length:', Math.round(prompt.length / 4));

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
      max_tokens: 200,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'suggest me some good educational scheme' }
      ]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test().catch(console.error);
