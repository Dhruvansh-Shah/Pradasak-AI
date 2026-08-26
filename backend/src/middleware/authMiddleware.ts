import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  adminEmail?: string;
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.adminEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
