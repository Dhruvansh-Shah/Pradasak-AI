import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireUser, UserAuthRequest } from '../middleware/userAuthMiddleware';

const router = Router();
router.use(requireUser);

function generateChatId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function autoTitle(firstMessage: string): string {
  return firstMessage.slice(0, 45).trim() + (firstMessage.length > 45 ? '…' : '');
}

// GET /api/chats — list all chats for the user
router.get('/', async (req: UserAuthRequest, res: Response) => {
  const { rows } = await pool.query<{
    id: string; title: string; created_at: Date; updated_at: Date; last_message: string;
  }>(
    `SELECT c.id, c.title, c.created_at, c.updated_at,
       (SELECT content FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM chats c
     WHERE c.user_id = $1
     ORDER BY c.updated_at DESC`,
    [req.userId]
  );
  res.json(rows);
});

// POST /api/chats — create new empty chat
router.post('/', async (req: UserAuthRequest, res: Response) => {
  const id = generateChatId();
  const { rows } = await pool.query(
    'INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3) RETURNING *',
    [id, req.userId, 'New Chat']
  );
  res.status(201).json(rows[0]);
});

// GET /api/chats/:id — get chat with messages
router.get('/:id', async (req: UserAuthRequest, res: Response) => {
  const { id } = req.params;
  const chatRes = await pool.query(
    'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
    [id, req.userId]
  );
  if (chatRes.rows.length === 0) { res.status(404).json({ error: 'Chat not found' }); return; }

  const msgRes = await pool.query(
    'SELECT id, role, content, type, data, quick_actions, disclaimer, created_at FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [id]
  );
  res.json({ chat: chatRes.rows[0], messages: msgRes.rows });
});

// PATCH /api/chats/:id — update title
router.patch('/:id', async (req: UserAuthRequest, res: Response) => {
  const { id } = req.params;
  const { title } = req.body as { title?: string };
  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }

  const { rows } = await pool.query(
    'UPDATE chats SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [title.trim(), id, req.userId]
  );
  if (rows.length === 0) { res.status(404).json({ error: 'Chat not found' }); return; }
  res.json(rows[0]);
});

// DELETE /api/chats/:id
router.delete('/:id', async (req: UserAuthRequest, res: Response) => {
  const { rowCount } = await pool.query(
    'DELETE FROM chats WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!rowCount) { res.status(404).json({ error: 'Chat not found' }); return; }
  res.json({ ok: true });
});

// Internal helper — exported for use in chat route
export { generateChatId, autoTitle };
export default router;
