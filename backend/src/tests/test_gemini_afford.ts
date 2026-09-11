import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

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
      messages: [{ role: 'user', content: 'hello' }]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
test().catch(console.error);
