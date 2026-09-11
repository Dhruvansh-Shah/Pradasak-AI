import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  const freeModels = data.data.filter((m: any) => m.id.endsWith(':free') || m.pricing?.prompt === '0');
  console.log(`Found ${freeModels.length} free models:`);
  for (const m of freeModels.slice(0, 20)) {
    console.log(`- ${m.id} (name: ${m.name})`);
  }
}
run().catch(console.error);
