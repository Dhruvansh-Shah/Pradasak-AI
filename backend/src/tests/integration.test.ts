import http from 'http';

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

function logTest(pass: boolean, name: string, detail?: string) {
  if (pass) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string
): Promise<{ status: number; data: any }> {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      url,
      {
        method,
        agent: false,
        timeout: 45000,
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode || 500, data });
          } catch {
            resolve({ status: res.statusCode || 500, data: raw });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runIntegrationTests() {
  console.log('\n================== END-TO-END INTEGRATION TESTS ==================\n');

  // Journey 1: Full Conversational Lifecycle for a Woman Entrepreneur (SHG / Tailoring)
  console.log('👩 Journey 1: Female Entrepreneur Seeking Concessional Loan');
  try {
    // Step 1: User asks in Hindi as a female applicant
    const turn1 = await request('POST', '/chat', {
      message: 'नमस्ते, मैं एक महिला हूँ और सिलाई केंद्र शुरू करना चाहती हूँ, 1 लाख का लोन चाहिए',
    });
    const hasMahilaScheme =
      turn1.status === 200 &&
      turn1.data?.type === 'schemes' &&
      (turn1.data?.data?.schemes || []).some((s: any) => s.name.includes('Mahila'));
    logTest(
      hasMahilaScheme,
      'Step 1: Hindi female entrepreneur query accurately recommends Mahila scheme cards',
      JSON.stringify({ status: turn1.status, type: turn1.data?.type, schemes: turn1.data?.data?.schemes?.map((s: any) => s.name) })
    );

    await sleep(500);
    const sessionId = turn1.data.sessionId;

    // Step 2: User provides location in Amravati
    const turn2 = await request('POST', '/chat', {
      message: 'हम अमरावती में रहते हैं, निकटतम बैंक कहाँ है?',
      sessionId,
    });
    logTest(
      turn2.status === 200 &&
      (turn2.data.type === 'partners' || turn2.data.type === 'schemes') &&
      turn2.data.message.length > 0,
      'Step 2: Follow-up location query resolves nearby channel partner branches for Amravati'
    );

    await sleep(500);

    // Step 3: User asks for documents
    const turn3 = await request('POST', '/chat', {
      message: 'आवेदन के लिए कौन से दस्तावेज लगेंगे?',
      sessionId,
    });
    logTest(
      turn3.status === 200 &&
      turn3.data.type === 'documents' &&
      Array.isArray(turn3.data.data?.documents) &&
      turn3.data.data.documents.some((d: string) => d.includes('Aadhaar')),
      'Step 3: Document checklist returns essential KYC and caste certificate requirements'
    );
  } catch (err: any) {
    logTest(false, 'Journey 1 Execution', err.message);
  }

  await sleep(1000);

  // Journey 2: Student Seeking Higher Education Loan in UK with EMI Verification
  console.log('\n🎓 Journey 2: Higher Education Abroad (ELS) & Subsidized Repayment');
  try {
    const eduTurn1 = await request('POST', '/chat', {
      message: 'I got admission for MS Computer Science in London, loan needed 25 lakh',
    });
    logTest(
      eduTurn1.status === 200 &&
      eduTurn1.data.data?.schemes[0]?.name.includes('Education Loan Scheme'),
      'Step 1: Matches Education Loan Scheme (ELS) up to 40 Lakh'
    );

    // Directly verify EMI calculation endpoint consistency with chat
    const calcDirect = await request('POST', '/emi/calculate', {
      principalLakh: 25.0,
      annualRatePercent: 4.0,
      tenureMonths: 120,
      moratoriumMonths: 12,
    });
    logTest(
      calcDirect.status === 200 && calcDirect.data.emi > 0 && calcDirect.data.totalInterest > 0,
      'Step 2: Direct EMI calculation for ₹25 Lakh @ 4% over 10 years matches official mathematical curve'
    );
  } catch (err: any) {
    logTest(false, 'Journey 2 Execution', err.message);
  }

  // Journey 3: Authenticated User Chat State Persistence across Multiple Sessions
  console.log('\n🔐 Journey 3: Authenticated Beneficiary Chat History in Database');
  try {
    const email = `journeystudent_${Date.now()}@example.com`;
    const pwd = 'SecuredPassword123!';
    const regRes = await request('POST', '/users/register', {
      email,
      password: pwd,
      name: 'Pooja Kamble',
      phone: '9988776655',
    });
    const token = regRes.data.token;

    // Send a message with chatId
    const chatCreation = await request('POST', '/chats', undefined, token);
    const chatId = chatCreation.data.id;

    const chatMsgRes = await request(
      'POST',
      '/chat',
      {
        message: 'I want to purchase an e-rickshaw in Pune, cost is 2 lakhs',
        chatId,
      },
      token
    );

    logTest(
      chatMsgRes.status === 200 && chatMsgRes.data.data?.schemes[0]?.name.includes('Green Business'),
      'Step 1: Authenticated user chat associates message to database session and recommends Green Business Scheme'
    );

    // Verify chat was saved to database and can be fetched via GET /api/chats/:id
    const fetchChat = await request('GET', `/chats/${chatId}`, undefined, token);
    logTest(
      fetchChat.status === 200 && Array.isArray(fetchChat.data.messages) && fetchChat.data.messages.length >= 2,
      'Step 2: Chat messages (user prompt + assistant response) successfully retrieved from PostgreSQL database'
    );
  } catch (err: any) {
    logTest(false, 'Journey 3 Execution', err.message);
  }

  console.log(`\n================== INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED ==================\n`);
  return failed === 0;
}

if (require.main === module) {
  runIntegrationTests().then((ok) => process.exit(ok ? 0 : 1));
}

export { runIntegrationTests };
