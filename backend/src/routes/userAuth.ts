import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { optionalUser, UserAuthRequest } from '../middleware/userAuthMiddleware';
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  _setTestPasswordResetOtp,
  _getTestPasswordResetOtpData,
  _clearTestPasswordResetData,
} from '../services/OtpService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

// Test-only endpoints (active in test/development environments)
if (process.env.NODE_ENV !== 'production') {
  router.post('/forgot-password/test-set-otp', async (req: Request, res: Response) => {
    const { email, otp, expiresInMs, attempts } = req.body;
    await _setTestPasswordResetOtp(email, otp, expiresInMs, attempts);
    res.json({ success: true });
  });

  router.get('/forgot-password/test-get-otp', (req: Request, res: Response) => {
    const email = String(req.query.email || '');
    const data = _getTestPasswordResetOtpData(email);
    res.json({ data });
  });

  router.post('/forgot-password/test-clear-otp', (req: Request, res: Response) => {
    const { email } = req.body;
    _clearTestPasswordResetData(email);
    res.json({ success: true });
  });
}

function issueToken(userId: number, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/users/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, phone, password, salary } = req.body as {
    name?: string; email?: string; phone?: string; password?: string; salary?: number;
  };

  const emailStr = email ? email.toLowerCase().trim() : '';
  const phoneStr = phone ? phone.trim() : '';
  const resolvedSalary = salary ? Number(salary) : null;

  if (!emailStr || !phoneStr || !password) {
    res.status(400).json({ error: 'email, phone, and password are required' });
    return;
  }
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(emailStr)) {
    res.status(400).json({ error: 'Only @gmail.com email addresses are allowed for signup' });
    return;
  }
  if (!/^\d{10}$/.test(phoneStr)) {
    res.status(400).json({ error: 'Invalid phone number. Please enter a 10-digit mobile number.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, salary) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, salary',
      [name || null, emailStr, phoneStr, passwordHash, resolvedSalary]
    );
    const user = rows[0] as { id: number; name: string; email: string; phone: string; salary: number | null };
    const token = issueToken(user.id, user.email);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, salary: user.salary } });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('unique')) {
      res.status(409).json({ error: 'An account with this email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// POST /api/users/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (rows.length === 0) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const user = rows[0] as { id: number; name: string; email: string; phone: string; password_hash: string; salary: number | null; city?: string | null; state?: string | null; district?: string | null; pincode?: string | null };
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const token = issueToken(user.id, user.email);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, salary: user.salary, city: user.city, state: user.state, district: user.district, pincode: user.pincode } });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login service temporarily unavailable. Please try again later.' });
  }
});

// GET /api/users/me
router.get('/me', optionalUser, async (req: UserAuthRequest, res: Response) => {
  // If no authenticated user, treat as guest
  if (!req.userId) {
    res.json({ guest: true });
    return;
  }
  try {
    const { rows } = await pool.query('SELECT id, name, email, phone, salary, city, district, state, pincode, created_at FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error('[User Me Error]', err);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// Single-use token tracking for password resets
const usedResetTokens = new Set<string>();

// POST /api/users/forgot-password/send-otp
router.post('/forgot-password/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  try {
    // Authoritative check against database
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(TRIM(email)) = $1',
      [cleanEmail]
    );

    if (rows.length > 0) {
      // User exists -> generate and send OTP
      await sendPasswordResetOtp(cleanEmail);
    } else {
      console.log(`[Forgot Password] Requested email ${cleanEmail} not found in database. Suppressing OTP generation.`);
    }

    // Security convention: return generic safe confirmation
    res.json({
      success: true,
      message: 'If an account exists for this email, a verification OTP has been sent.',
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Please wait')) {
      res.status(429).json({ error: err.message });
      return;
    }
    console.error('[Forgot Password Error]', err);
    res.status(500).json({ error: 'Failed to process password reset request. Please try again later.' });
  }
});

// POST /api/users/forgot-password/verify-otp
router.post('/forgot-password/verify-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email?: string; otp?: string };
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanOtp = otp ? otp.trim() : '';

  if (!cleanEmail || !cleanOtp) {
    res.status(400).json({ error: 'Email and OTP are required.' });
    return;
  }

  try {
    // Authoritative check: account must exist
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(TRIM(email)) = $1',
      [cleanEmail]
    );
    if (rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired OTP session.' });
      return;
    }

    // Verify OTP securely on backend
    await verifyPasswordResetOtp(cleanEmail, cleanOtp);

    // Issue short-lived secure reset authorization token (15 mins)
    const resetToken = jwt.sign(
      { userId: rows[0].id, email: cleanEmail, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'OTP verification failed.' });
  }
});

// POST /api/users/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { resetToken, newPassword, confirmPassword } = req.body as {
    resetToken?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (!resetToken || !newPassword) {
    res.status(400).json({ error: 'Reset authorization token and new password are required.' });
    return;
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  // Prevent token reuse
  if (usedResetTokens.has(resetToken)) {
    res.status(400).json({ error: 'This reset token has already been used. Please request a new OTP.' });
    return;
  }

  let payload: { userId: number; email: string; purpose: string };
  try {
    payload = jwt.verify(resetToken, JWT_SECRET) as { userId: number; email: string; purpose: string };
  } catch (err) {
    res.status(400).json({ error: 'This reset session has expired or is invalid. Please request a new OTP.' });
    return;
  }

  if (payload.purpose !== 'password_reset' || !payload.userId || !payload.email) {
    res.status(400).json({ error: 'Invalid reset authorization token.' });
    return;
  }

  // Mark token as used immediately
  usedResetTokens.add(resetToken);
  setTimeout(() => usedResetTokens.delete(resetToken), 15 * 60 * 1000);

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { rows } = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE id = $2 AND LOWER(TRIM(email)) = $3 
       RETURNING id, name, email, phone, salary, city, state, district, pincode`,
      [passwordHash, payload.userId, payload.email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const user = rows[0] as {
      id: number;
      name: string;
      email: string;
      phone: string;
      salary: number | null;
      city?: string | null;
      state?: string | null;
      district?: string | null;
      pincode?: string | null;
    };

    // Automatically create authenticated session
    const token = issueToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Password reset successfully. You are now signed in.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        salary: user.salary,
        city: user.city,
        state: user.state,
        district: user.district,
        pincode: user.pincode,
      },
    });
  } catch (err) {
    console.error('[Reset Password DB Error]', err);
    res.status(500).json({ error: 'Failed to update password. Please try again later.' });
  }
});

export default router;

