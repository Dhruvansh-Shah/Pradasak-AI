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
        headers: {
          'Content-Type': 'application/json',
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
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runFunctionalTests() {
  console.log('\n================== FUNCTIONAL API TESTS ==================\n');

  // 1. Health / Server Check
  try {
    const res = await request('GET', '/schemes');
    logTest(res.status === 200 && Array.isArray(res.data), 'GET /api/schemes returns active scheme catalog');
  } catch (err: any) {
    logTest(false, 'GET /api/schemes', err.message);
  }

  // 2. Direct EMI Calculator API
  try {
    const emiRes = await request('POST', '/emi/calculate', {
      principalLakh: 2.0,
      annualRatePercent: 6.0,
      tenureMonths: 60,
      moratoriumMonths: 6,
    });
    const validEmi =
      emiRes.status === 200 &&
      typeof emiRes.data.emi === 'number' &&
      Array.isArray(emiRes.data.schedule) &&
      emiRes.data.schedule.length === 66; // 6 moratorium + 60 tenure
    logTest(validEmi, 'POST /api/emi/calculate computes accurate amortization schedule with moratorium');
  } catch (err: any) {
    logTest(false, 'POST /api/emi/calculate', err.message);
  }

  // 3. Channel Partner Discovery with Distance & NPA filter
  try {
    const partnerRes = await request('GET', '/partners/nearby?city=Amravati&radiusKm=200');
    const validPartners =
      partnerRes.status === 200 &&
      Array.isArray(partnerRes.data.partners) &&
      partnerRes.data.partners.length > 0 &&
      partnerRes.data.partners[0].name.includes('Vidarbha Konkan Gramin Bank');
    logTest(validPartners, 'GET /api/partners/nearby resolves Amravati and locates Vidarbha Konkan Gramin Bank');
  } catch (err: any) {
    logTest(false, 'GET /api/partners/nearby', err.message);
  }

  // 4. Partner NPA / Utilization Threshold Filter
  try {
    const strictRes = await request('GET', '/partners/nearby?city=Delhi&radiusKm=50');
    const allValidNpa =
      strictRes.status === 200 &&
      strictRes.data.partners.every((p: any) => !p.npa_percent || parseFloat(p.npa_percent) <= 8.0);
    logTest(allValidNpa, 'GET /api/partners/nearby enforces max NPA threshold (<= 8.0%)');
  } catch (err: any) {
    logTest(false, 'NPA threshold check', err.message);
  }

  // 5. User Authentication Cycle (Register -> Login -> Token generation)
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let userToken = '';

  try {
    const regRes = await request('POST', '/users/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test Beneficiary',
      phone: '9876543210',
    });
    logTest(regRes.status === 201 && !!regRes.data.token, 'POST /api/users/register creates user and issues JWT');
    userToken = regRes.data.token;
  } catch (err: any) {
    logTest(false, 'POST /api/users/register', err.message);
  }

  try {
    const loginRes = await request('POST', '/users/login', {
      email: testEmail,
      password: testPassword,
    });
    logTest(loginRes.status === 200 && !!loginRes.data.token, 'POST /api/users/login verifies password and returns token');
  } catch (err: any) {
    logTest(false, 'POST /api/users/login', err.message);
  }

  // 6. User Profile Retrieval
  if (userToken) {
    try {
      const meRes = await request('GET', '/users/me', undefined, userToken);
      logTest(meRes.status === 200 && meRes.data.email === testEmail, 'GET /api/users/me returns authenticated user details');
    } catch (err: any) {
      logTest(false, 'GET /api/users/me', err.message);
    }
  }

  // 7. Chats Management for Authenticated User
  if (userToken) {
    let createdChatId = '';
    try {
      const createChatRes = await request('POST', '/chats', undefined, userToken);
      createdChatId = createChatRes.data.id;
      logTest(createChatRes.status === 201 && !!createdChatId, 'POST /api/chats initializes new session for user');
    } catch (err: any) {
      logTest(false, 'POST /api/chats', err.message);
    }

    if (createdChatId) {
      try {
        const patchRes = await request('PATCH', `/chats/${createdChatId}`, { title: 'Education Loan Query' }, userToken);
        logTest(patchRes.status === 200 && patchRes.data.title === 'Education Loan Query', 'PATCH /api/chats/:id updates chat title');
      } catch (err: any) {
        logTest(false, 'PATCH /api/chats/:id', err.message);
      }

      try {
        const delRes = await request('DELETE', `/chats/${createdChatId}`, undefined, userToken);
        logTest(delRes.status === 200 && delRes.data.ok === true, 'DELETE /api/chats/:id deletes chat session');
      } catch (err: any) {
        logTest(false, 'DELETE /api/chats/:id', err.message);
      }
    }
  }

  // 8. Multi-turn Conversational Chat API
  try {
    const chatTurn1 = await request('POST', '/chat', {
      message: 'I want to open a small grocery shop, need 1 lakh loan',
    });
    const validTurn1 =
      chatTurn1.status === 200 &&
      chatTurn1.data.type === 'schemes' &&
      Array.isArray(chatTurn1.data.data?.schemes) &&
      !chatTurn1.data.data.schemes.some((s: any) => s.name.includes('Mahila'));
    logTest(validTurn1, 'POST /api/chat (Turn 1) returns relevant scheme cards excluding Mahila schemes for general user');

    const sessionId = chatTurn1.data.sessionId;
    if (sessionId) {
      const chatTurn2 = await request('POST', '/chat', {
        message: 'Calculate EMI for this loan',
        sessionId,
      });
      const validTurn2 =
        chatTurn2.status === 200 &&
        chatTurn2.data.type === 'emi' &&
        typeof chatTurn2.data.data?.emi === 'number';
      logTest(validTurn2, 'POST /api/chat (Turn 2) preserves multi-turn session and returns EMI breakdown');
    }
  } catch (err: any) {
    logTest(false, 'POST /api/chat multi-turn flow', err.message);
  }

  console.log(`\n================== FUNCTIONAL SUMMARY: ${passed} PASSED, ${failed} FAILED ==================\n`);
  return failed === 0;
}

if (require.main === module) {
  runFunctionalTests().then((ok) => process.exit(ok ? 0 : 1));
}

export { runFunctionalTests };
