import http from 'http';
import { pool } from '../db/pool';

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
  body?: Record<string, unknown>
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

async function runTests() {
  console.log('\n================== REGISTRATION EMAIL DUPLICATE CHECK TESTS ==================\n');

  const timestamp = Date.now();
  const existingEmail = `test_registered_${timestamp}@example.com`;
  const nonExistentEmail = `test_unregistered_${timestamp}@example.com`;

  // Create an existing user in the database
  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['Existing Test User', existingEmail, '9876543210', 'hashed_pw']
  );

  try {
    // ── Case 1: New un-registered email ──────────────────────────────────────────
    console.log('Case 1: New un-registered email');
    const newRes = await request('POST', '/registration/send-email-otp', {
      email: nonExistentEmail,
    });
    logTest(
      newRes.status === 200 && newRes.data?.success === true,
      'New email allows OTP generation and sending',
      JSON.stringify(newRes.data)
    );

    // ── Case 2: Existing email ──────────────────────────────────────────────────
    console.log('\nCase 2: Existing registered email');
    const existRes = await request('POST', '/registration/send-email-otp', {
      email: existingEmail,
    });
    logTest(
      existRes.status === 409 &&
      existRes.data?.code === 'EMAIL_ALREADY_EXISTS' &&
      existRes.data?.error?.includes('Account with this email ID already exists'),
      'Existing email rejected with HTTP 409 and EMAIL_ALREADY_EXISTS before OTP generation',
      JSON.stringify(existRes.data)
    );

    // ── Case 3: Existing email with different casing ────────────────────────────
    console.log('\nCase 3: Existing email with different casing');
    const upperEmail = `TEST_REGISTERED_${timestamp}@EXAMPLE.COM`;
    const caseRes = await request('POST', '/registration/send-email-otp', {
      email: upperEmail,
    });
    logTest(
      caseRes.status === 409 &&
      caseRes.data?.code === 'EMAIL_ALREADY_EXISTS',
      'Case-insensitive match detects existing account (UPPERCASE input)',
      JSON.stringify(caseRes.data)
    );

    // ── Case 4: Existing email with whitespace ──────────────────────────────────
    console.log('\nCase 4: Existing email with whitespace');
    const paddedEmail = `   ${existingEmail}   `;
    const spaceRes = await request('POST', '/registration/send-email-otp', {
      email: paddedEmail,
    });
    logTest(
      spaceRes.status === 409 &&
      spaceRes.data?.code === 'EMAIL_ALREADY_EXISTS',
      'Whitespace-padded email detects existing account',
      JSON.stringify(spaceRes.data)
    );

    // ── Case 5: Resend OTP for legitimate in-progress registration ──────────────
    console.log('\nCase 5: Resend OTP for legitimate un-registered applicant');
    const anotherNewEmail = `test_resend_${timestamp}@example.com`;
    const send1 = await request('POST', '/registration/send-email-otp', {
      email: anotherNewEmail,
    });
    logTest(
      send1.status === 200 && send1.data?.success === true,
      'First OTP request succeeded for fresh email',
      JSON.stringify(send1.data)
    );

    // ── Case 6: Invalid email format check ──────────────────────────────────────
    console.log('\nCase 6: Invalid email formatting rejected cleanly');
    const badEmailRes = await request('POST', '/registration/send-email-otp', {
      email: 'not-an-email',
    });
    logTest(
      badEmailRes.status === 400,
      'Malformed email rejected with HTTP 400',
      JSON.stringify(badEmailRes.data)
    );

  } finally {
    // Cleanup test user
    await pool.query('DELETE FROM users WHERE email = $1', [existingEmail]);
    await pool.end();
  }

  console.log(`\n================== SUMMARY: ${passed} PASSED, ${failed} FAILED ==================\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
