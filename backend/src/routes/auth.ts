import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nsfdc.gov.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2024';
const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  if (email !== ADMIN_EMAIL) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // In production, compare against hashed password in DB.
  // For this MVP, do a direct comparison (admin password is in env).
  const valid = password === ADMIN_PASSWORD || await bcrypt.compare(password, ADMIN_PASSWORD).catch(() => false);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email, role: 'admin' });
});

export default router;
