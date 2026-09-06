import http from 'http';
import bcrypt from 'bcryptjs';
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

async function runTests() {
  console.log('\n================== FORGOT PASSWORD & RESET FLOW TESTS ==================\n');

  const timestamp = Date.now();
  const testEmail = `forgot_user_${timestamp}@gmail.com`;
  const nonExistentEmail = `nonexistent_${timestamp}@gmail.com`;
  const initialPassword = 'old_password_123';
  const newPassword = 'new_password_456';

  // 1. Create registered user in database
  const initialHash = await bcrypt.hash(initialPassword, 10);
  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, salary)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    ['Forgot Password Test User', testEmail, '9123456780', initialHash, 300000]
  );

  try {
    // ── Case 1: Non-existent email requesting OTP ─────────────────────────────
    console.log('Case 1: Unknown email requesting OTP');
    const unknownRes = await request('POST', '/users/forgot-password/send-otp', {
      email: nonExistentEmail,
    });
    logTest(
      unknownRes.status === 200 &&
      unknownRes.data?.success === true &&
      unknownRes.data?.message?.includes('If an account exists'),
      'Returns generic safe message for non-existent email',
      JSON.stringify(unknownRes.data)
    );

    const unknownOtpRes = await request('GET', `/users/forgot-password/test-get-otp?email=${encodeURIComponent(nonExistentEmail)}`);
    logTest(
      !unknownOtpRes.data?.data,
      'No OTP is generated or stored for non-existent email'
    );

    // ── Case 2: Existing registered email requesting OTP ─────────────────────
    console.log('\nCase 2: Registered email requesting OTP');
    const existingRes = await request('POST', '/users/forgot-password/send-otp', {
      email: testEmail,
    });
    logTest(
      existingRes.status === 200 && existingRes.data?.success === true,
      'Returns success for registered email',
      JSON.stringify(existingRes.data)
    );

    const existingOtpRes = await request('GET', `/users/forgot-password/test-get-otp?email=${encodeURIComponent(testEmail)}`);
    logTest(
      existingOtpRes.data?.data && typeof existingOtpRes.data.data.hash === 'string',
      'OTP is securely generated, hashed, and stored for registered email'
    );

    // ── Case 3: Cooldown protection ──────────────────────────────────────────
    console.log('\nCase 3: Cooldown protection on immediate re-send');
    const cooldownRes = await request('POST', '/users/forgot-password/send-otp', {
      email: testEmail,
    });
    logTest(
      cooldownRes.status === 429 && cooldownRes.data?.error?.includes('Please wait'),
      'Rate-limits immediate consecutive OTP request (HTTP 429)',
      JSON.stringify(cooldownRes.data)
    );

    // Clear cooldown on server
    await request('POST', '/users/forgot-password/test-clear-otp', { email: testEmail });

    // ── Case 4: Wrong OTP verification ───────────────────────────────────────
    console.log('\nCase 4: Incorrect OTP rejection');
    await request('POST', '/users/forgot-password/test-set-otp', {
      email: testEmail,
      otp: '123456',
    });
    const wrongOtpRes = await request('POST', '/users/forgot-password/verify-otp', {
      email: testEmail,
      otp: '999999',
    });
    logTest(
      wrongOtpRes.status === 400 &&
      wrongOtpRes.data?.error?.includes('The OTP you entered is incorrect'),
      'Rejects incorrect OTP with user-friendly error',
      JSON.stringify(wrongOtpRes.data)
    );

    // ── Case 5: Expired OTP rejection ────────────────────────────────────────
    console.log('\nCase 5: Expired OTP rejection');
    await request('POST', '/users/forgot-password/test-set-otp', {
      email: testEmail,
      otp: '654321',
      expiresInMs: -5000, // expired
    });
    const expiredRes = await request('POST', '/users/forgot-password/verify-otp', {
      email: testEmail,
      otp: '654321',
    });
    logTest(
      expiredRes.status === 400 &&
      expiredRes.data?.error?.includes('expired'),
      'Rejects expired OTP with prompt to request a new one',
      JSON.stringify(expiredRes.data)
    );

    // ── Case 6: Valid OTP verification issues reset token ───────────────────
    console.log('\nCase 6: Valid OTP verification');
    const validOtp = '789012';
    await request('POST', '/users/forgot-password/test-set-otp', {
      email: testEmail,
      otp: validOtp,
    });
    const validOtpRes = await request('POST', '/users/forgot-password/verify-otp', {
      email: testEmail,
      otp: validOtp,
    });
    logTest(
      validOtpRes.status === 200 &&
      validOtpRes.data?.success === true &&
      typeof validOtpRes.data?.resetToken === 'string',
      'Issues signed resetToken upon successful OTP verification',
      JSON.stringify(validOtpRes.data)
    );
    const resetToken = validOtpRes.data?.resetToken;

    // ── Case 7: OTP cannot be reused ─────────────────────────────────────────
    console.log('\nCase 7: Single-use OTP invalidation');
    const reuseOtpRes = await request('POST', '/users/forgot-password/verify-otp', {
      email: testEmail,
      otp: validOtp,
    });
    logTest(
      reuseOtpRes.status === 400,
      'Rejects attempt to reuse already verified OTP'
    );

    // ── Case 8: Password mismatch rejection ──────────────────────────────────
    console.log('\nCase 8: Password mismatch');
    const mismatchRes = await request('POST', '/users/reset-password', {
      resetToken,
      newPassword: 'new_password_123',
      confirmPassword: 'different_password_456',
    });
    logTest(
      mismatchRes.status === 400 &&
      mismatchRes.data?.error?.includes('Passwords do not match'),
      'Rejects reset when newPassword and confirmPassword mismatch'
    );

    // ── Case 9: Password too short ───────────────────────────────────────────
    console.log('\nCase 9: Password too short (< 6 characters)');
    const shortPwRes = await request('POST', '/users/reset-password', {
      resetToken,
      newPassword: '123',
      confirmPassword: '123',
    });
    logTest(
      shortPwRes.status === 400 &&
      shortPwRes.data?.error?.includes('at least 6 characters'),
      'Rejects reset when password is less than 6 characters'
    );

    // ── Case 10: Successful password reset & automatic login ─────────────────
    console.log('\nCase 10: Successful password reset & automatic login');
    const resetRes = await request('POST', '/users/reset-password', {
      resetToken,
      newPassword,
      confirmPassword: newPassword,
    });
    logTest(
      resetRes.status === 200 &&
      resetRes.data?.success === true &&
      typeof resetRes.data?.token === 'string' &&
      resetRes.data?.user?.email === testEmail,
      'Updates password in DB, returns authenticated session token and user profile',
      JSON.stringify(resetRes.data)
    );

    // ── Case 11: Authenticated session works ─────────────────────────────────
    console.log('\nCase 11: Auto-login session verification via /me');
    const sessionToken = resetRes.data?.token;
    const meRes = await request('GET', '/users/me', undefined, sessionToken);
    logTest(
      meRes.status === 200 && meRes.data?.email === testEmail,
      'Returned session token immediately authenticates user on /users/me'
    );

    // ── Case 12: Reset token reuse blocked ───────────────────────────────────
    console.log('\nCase 12: Prevent reset token reuse');
    const tokenReuseRes = await request('POST', '/users/reset-password', {
      resetToken,
      newPassword: 'yet_another_password_789',
      confirmPassword: 'yet_another_password_789',
    });
    logTest(
      tokenReuseRes.status === 400 &&
      tokenReuseRes.data?.error?.includes('already been used'),
      'Blocks reuse of previously used reset token'
    );

    // ── Case 13: Old password cannot log in ──────────────────────────────────
    console.log('\nCase 13: Verify old password is invalid');
    const oldLoginRes = await request('POST', '/users/login', {
      email: testEmail,
      password: initialPassword,
    });
    logTest(
      oldLoginRes.status === 401,
      'Old password no longer authenticates (HTTP 401)'
    );

    // ── Case 14: New password logs in successfully ───────────────────────────
    console.log('\nCase 14: Verify new password logs in');
    const newLoginRes = await request('POST', '/users/login', {
      email: testEmail,
      password: newPassword,
    });
    logTest(
      newLoginRes.status === 200 &&
      typeof newLoginRes.data?.token === 'string' &&
      newLoginRes.data?.user?.email === testEmail,
      'New password successfully logs in and returns session token'
    );

  } finally {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  }

  console.log(`\n================== SUMMARY ==================`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`=============================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
