import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requireUser, UserAuthRequest } from '../middleware/userAuthMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

function issueToken(userId: number, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/users/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body as {
    name?: string; email?: string; phone?: string; password?: string;
  };

  if (!email || !phone || !password) {
    res.status(400).json({ error: 'email, phone, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
      [name || null, email.toLowerCase().trim(), phone.trim(), passwordHash]
    );
    const user = rows[0] as { id: number; name: string; email: string; phone: string };
    const token = issueToken(user.id, user.email);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
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

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (rows.length === 0) { res.status(401).json({ error: 'Invalid email or password' }); return; }

  const user = rows[0] as { id: number; name: string; email: string; phone: string; password_hash: string };
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

  const token = issueToken(user.id, user.email);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

// GET /api/users/me
router.get('/me', requireUser, async (req: UserAuthRequest, res: Response) => {
  const { rows } = await pool.query('SELECT id, name, email, phone, created_at FROM users WHERE id = $1', [req.userId]);
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(rows[0]);
});

export default router;
