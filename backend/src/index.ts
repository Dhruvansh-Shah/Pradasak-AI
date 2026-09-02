import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import recommendRoutes from './routes/recommend';
import emiRoutes from './routes/emi';
import partnersRoutes from './routes/partners';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userAuthRoutes from './routes/userAuth';
import chatsRoutes from './routes/chats';
import { pool } from './db/pool';

dotenv.config();

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

// ── Main API (port 4000) ──────────────────────────────────────────────────────

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter((value): value is string => Boolean(value));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/users', userAuthRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/auth', authRoutes);           // admin auth
app.use('/api/admin', adminRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/partners', partnersRoutes);

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });

// Public schemes endpoint (no auth needed)
app.get('/api/schemes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM schemes WHERE active = TRUE ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

app.use((err: Error, _req: import('express').Request, res: import('express').Response, _next: import('express').NextFunction) => {
  const msg = err?.message || String(err);
  process.stdout.write(`[express-error] ${msg}\n${err?.stack || ''}\n`);
  res.status(500).json({ error: 'Internal server error', detail: msg });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

// ── Admin static server (port 3001) ──────────────────────────────────────────

const adminApp = express();
adminApp.use(cors());
// Serve admin SPA from admin-static directory
const adminDir = path.join(__dirname, 'admin-static');
adminApp.use(express.static(adminDir));
adminApp.use((_req, res) => res.sendFile(path.join(adminDir, 'index.html')));

const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
adminApp.listen(ADMIN_PORT, () => console.log(`Admin panel running on http://localhost:${ADMIN_PORT}`));
