import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

export interface UserAuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export async function requireUser(req: UserAuthRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number; email: string };
    if (!payload?.userId) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }
    const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.userId]);
    if (rows.length === 0) {
      res.status(401).json({ error: 'User account not found. Please log in again.' });
      return;
    }
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalUser(req: UserAuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number; email: string };
      if (payload?.userId) {
        const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.userId]);
        if (rows.length > 0) {
          req.userId = payload.userId;
          req.userEmail = payload.email;
        }
      }
    } catch { /* ignore */ }
  }
  next();
}
