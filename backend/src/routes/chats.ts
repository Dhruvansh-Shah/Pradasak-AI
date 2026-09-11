import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireUser, UserAuthRequest } from '../middleware/userAuthMiddleware';

const router = Router();

function generateChatId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function generateShareId(): string {
  return 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function autoTitle(firstMessage: string): string {
  return firstMessage.slice(0, 45).trim() + (firstMessage.length > 45 ? '…' : '');
}

// ── Public Routes (No Auth Required) ──────────────────────────────────────────

// GET /api/chats/shared/:shareId — view public shared chat
router.get('/shared/:shareId', async (req: Request, res: Response) => {
  const shareId = String(req.params.shareId || '').trim();
  if (!shareId) {
    res.status(400).json({ error: 'shareId is required' });
    return;
  }

  try {
    const chatRes = await pool.query<{
      id: string;
      title: string;
      created_at: Date;
    }>(
      'SELECT id, title, created_at FROM chats WHERE share_id = $1 AND is_shared = TRUE',
      [shareId]
    );

    if (chatRes.rows.length === 0) {
      res.status(404).json({ error: 'Shared conversation not found or link has expired' });
      return;
    }

    const chat = chatRes.rows[0];
    const msgRes = await pool.query(
      `SELECT id, role, content, type, data, quick_actions, disclaimer, created_at
       FROM chat_messages
       WHERE chat_id = $1
       ORDER BY created_at ASC`,
      [chat.id]
    );

    // Secure, clean response containing only the intentionally shared conversation
    res.json({
      chat: {
        title: chat.title,
        created_at: chat.created_at,
      },
      messages: msgRes.rows,
    });
  } catch (err) {
    console.error('[chats] GET /shared/:shareId error:', err);
    res.status(500).json({ error: 'Failed to retrieve shared conversation' });
  }
});

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(requireUser);

// GET /api/chats — list all chats for the user
router.get('/', async (req: UserAuthRequest, res: Response) => {
  const { rows } = await pool.query<{
    id: string; title: string; created_at: Date; updated_at: Date; last_message: string; is_shared: boolean; share_id: string | null;
  }>(
    `SELECT c.id, c.title, c.created_at, c.updated_at, c.is_shared, c.share_id,
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

// POST /api/chats/import — import/migrate guest chat to user account idempotently
router.post('/import', async (req: UserAuthRequest, res: Response) => {
  const { clientChatId, messages, title } = req.body as {
    clientChatId?: string;
    messages?: Array<{
      role: 'user' | 'assistant';
      content?: string;
      text?: string;
      type?: string;
      data?: Record<string, unknown>;
      quickActions?: unknown;
      quick_actions?: unknown;
      disclaimer?: string;
      speechText?: string;
    }>;
    title?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'No messages to import' });
    return;
  }

  try {
    // 1. Check idempotency: did we already import this guest conversation?
    if (clientChatId) {
      const existing = await pool.query<{ id: string; title: string }>(
        `SELECT id, title FROM chats
         WHERE user_id = $1 AND (id = $2 OR session_data->>'migrated_from' = $2)
         LIMIT 1`,
        [req.userId, clientChatId]
      );
      if (existing.rows.length > 0) {
        res.json({
          id: existing.rows[0].id,
          title: existing.rows[0].title,
          ok: true,
          alreadyImported: true,
        });
        return;
      }
    }

    // 2. Derive title from first user message
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const firstMsgText = firstUserMsg ? (firstUserMsg.content || firstUserMsg.text || '') : '';
    const chatTitle = (title && title.trim()) || (firstMsgText ? autoTitle(firstMsgText) : 'Saved Consultation');

    const newChatId = generateChatId();
    const sessionData = clientChatId ? { migrated_from: clientChatId } : {};

    await pool.query(
      'INSERT INTO chats (id, user_id, title, session_data) VALUES ($1, $2, $3, $4)',
      [newChatId, req.userId, chatTitle, JSON.stringify(sessionData)]
    );

    // 3. Batch insert messages
    for (const msg of messages) {
      const content = (msg.content || msg.text || '').trim();
      if (!content) continue;

      const role = msg.role === 'user' ? 'user' : 'assistant';
      const msgType = msg.type || 'text';
      const dataJson = msg.data ? JSON.stringify(msg.data) : null;
      const qa = msg.quick_actions || msg.quickActions;
      const qaJson = qa ? JSON.stringify(qa) : null;
      const disclaimer = msg.disclaimer || null;

      await pool.query(
        `INSERT INTO chat_messages (chat_id, role, content, type, data, quick_actions, disclaimer)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newChatId, role, content, msgType, dataJson, qaJson, disclaimer]
      );
    }

    res.status(201).json({
      id: newChatId,
      title: chatTitle,
      ok: true,
    });
  } catch (err) {
    console.error('[chats] POST /import error:', err);
    res.status(500).json({ error: 'Failed to import chat' });
  }
});

// POST /api/chats/:id/share — generate shareable URL for a persisted chat
router.post('/:id/share', async (req: UserAuthRequest, res: Response) => {
  const id = req.params.id as string;

  try {
    // 1. Verify user owns the chat
    const chatRes = await pool.query<{
      id: string;
      title: string;
      is_shared: boolean;
      share_id: string | null;
    }>(
      'SELECT id, title, is_shared, share_id FROM chats WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (chatRes.rows.length === 0) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    const currentChat = chatRes.rows[0];
    let shareId = currentChat.share_id;

    if (!shareId) {
      shareId = generateShareId();
    }

    await pool.query(
      'UPDATE chats SET is_shared = TRUE, share_id = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [shareId, id, req.userId]
    );

    res.json({
      ok: true,
      shareId,
      chatId: id,
    });
  } catch (err) {
    console.error('[chats] POST /:id/share error:', err);
    res.status(500).json({ error: 'Failed to share chat' });
  }
});

// GET /api/chats/:id — get chat with messages
router.get('/:id', async (req: UserAuthRequest, res: Response) => {
  const id = req.params.id as string;
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
  const id = req.params.id as string;
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
    [req.params.id as string, req.userId]
  );
  if (!rowCount) { res.status(404).json({ error: 'Chat not found' }); return; }
  res.json({ ok: true });
});

// Internal helpers — exported for use in chat route
export { generateChatId, autoTitle };
export default router;
