import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const conciseTools = [
  {
    type: 'function',
    function: {
      name: 'recommend_schemes',
      description: 'Look up and score NSFDC loan schemes from the database matching the user inquiry, business plan, or educational purpose.',
      parameters: {
        type: 'object',
        properties: {
          purpose: { type: 'string', description: 'Loan purpose or scheme name/acronym' },
          loan_amount_rs: { type: 'number', description: 'Requested loan amount in rupees' },
          family_income_rs: { type: 'number', description: 'Annual family income in rupees' },
          education_level: { type: 'string', enum: ['school', 'diploma', 'undergraduate', 'postgraduate'] },
          gender: { type: 'string', enum: ['male', 'female'] },
          location: { type: 'string', description: 'City or district' },
          category_hint: { type: 'string', enum: ['education_loan', 'business_loan'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_emi',
      description: 'Compute exact monthly EMI, total interest, and repayment schedule for a loan amount and interest rate.',
      parameters: {
        type: 'object',
        properties: {
          loan_amount_rs: { type: 'number', description: 'Principal amount in rupees' },
          interest_rate_pct: { type: 'number', description: 'Annual interest rate percent' },
          tenure_months: { type: 'number', description: 'Tenure in months' },
          moratorium_months: { type: 'number', description: 'Moratorium months, 0 if none' },
        },
        required: ['loan_amount_rs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_partners',
      description: 'Find nearby authorized NSFDC channel partner banks and agencies using geo-spatial search.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or district name' },
          category: { type: 'string', description: 'Scheme category filter' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_required_documents',
      description: 'Get required application documents checklist for a scheme.',
      parameters: {
        type: 'object',
        properties: {
          scheme_id: { type: 'number' },
          scheme_name: { type: 'string' },
          is_education: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_schemes',
      description: 'Fetch two or more schemes side by side for comparison.',
      parameters: {
        type: 'object',
        properties: {
          scheme_ids: { type: 'array', items: { type: 'number' } },
          scheme_names: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
];

async function test() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const prompt = `You are Pradarshak AI Financial Advisor (NSFDC, Govt. of India). Help Scheduled Caste beneficiaries find subsidized loan schemes, EMIs, partners, and documents.
AUTHENTICATED BENEFICIARY PROFILE:
- Name: Aryan Phanse | Category: SC | Annual Income: ₹1,89,525 (verified ceiling ≤ ₹5L)
- Location: Pune, Maharashtra | Gender: Male | Education: Graduate | Trade: Education
ZERO-REDUNDANCY: Profile is verified. NEVER ask for income, location, or trade. Use verified Pune and income ₹1,89,525.
RESPONSE LANGUAGE: English (en). Natural conversational Indian tone.
RULES:
- Call recommend_schemes for loan/education scheme requests.
- Call find_partners for location/branch/bank queries.
- Call calculate_emi for loan repayment/EMI calculation.
- Never guess numbers or interest rates; use tool outputs.
- Write in plain prose only: NO markdown headings, bold, pipes, or bullet points.
- Output ONLY the user-facing message. NEVER output thinking process or scratchpad reasoning.
- Gram Panchayat jurisdiction: Under Article 243G, Gram Panchayats cannot sanction NSFDC loans; loans are routed only via accredited SCAs and Banks.`;

  console.log('Testing prompt length:', prompt.length);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sih-channel-finance.app',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 150,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'suggest me some good educational scheme' }
      ],
      tools: conciseTools,
      tool_choice: 'auto'
    })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test().catch(console.error);
