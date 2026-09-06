import { Router, Request, Response } from 'express';
import { process as orchestrate } from '../services/ChatOrchestrator';
import type { SchemeActionPayload } from '../services/ChatOrchestrator';
import { pool } from '../db/pool';
import { optionalUser, UserAuthRequest } from '../middleware/userAuthMiddleware';
import { generateChatId, autoTitle } from './chats';

const router = Router();
router.use(optionalUser);

// POST /api/chat
router.post('/', async (req: UserAuthRequest, res: Response) => {
  const {
    message,
    chatId: incomingChatId,
    sessionId: incomingSessionId,
    language,
    detectedLanguageCode,
    languageProbability,
    category,
    schemeAction,
  } = req.body as {
    message?: string;
    chatId?: string;
    sessionId?: string;
    language?: string;
    detectedLanguageCode?: string;
    languageProbability?: number;
    category?: string;
    schemeAction?: SchemeActionPayload;
  };

  const effectiveMessage = (message && message.trim()) || (
    schemeAction?.action === 'KNOW_MORE'
      ? `Learn more about ${schemeAction.schemeName || 'selected scheme'}`
      : schemeAction?.action === 'DOCUMENTS'
      ? `Required documents for ${schemeAction.schemeName || 'selected scheme'}`
      : schemeAction?.action === 'EMI'
      ? `Calculate EMI for ${schemeAction.schemeName || 'selected scheme'}`
      : schemeAction?.action === 'COMPARE'
      ? 'Compare selected schemes'
      : ''
  );

  if (!effectiveMessage) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const userId = req.userId;
  let chatId = incomingChatId;
  const activeSessionId = chatId || incomingSessionId || undefined;

  try {
    // If authenticated, persist the chat
    if (userId) {
      if (!chatId) {
        // Create new chat
        chatId = generateChatId();
        await pool.query(
          'INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3)',
          [chatId, userId, autoTitle(effectiveMessage)]
        );
      } else {
        // Verify ownership
        const { rows } = await pool.query('SELECT id FROM chats WHERE id = $1 AND user_id = $2', [chatId, userId]);
        if (rows.length === 0) {
          res.status(403).json({ error: 'Chat not found or access denied' });
          return;
        }
        // Auto-title if still "New Chat"
        const { rows: chatRows } = await pool.query('SELECT title FROM chats WHERE id = $1', [chatId]);
        if (chatRows[0]?.title === 'New Chat') {
          await pool.query('UPDATE chats SET title = $1 WHERE id = $2', [autoTitle(effectiveMessage), chatId]);
        }
      }

      // Save user message to DB
      await pool.query(
        'INSERT INTO chat_messages (chat_id, role, content, type) VALUES ($1, $2, $3, $4)',
        [chatId, 'user', effectiveMessage, 'text']
      );
    }

    // Fetch user profile info (name and verified salary) if authenticated
    let userContext: { name?: string | null; salary?: number | null } | undefined;
    if (userId) {
      const { rows: userRows } = await pool.query<{ name: string | null; salary: string | number | null }>(
        'SELECT name, salary FROM users WHERE id = $1',
        [userId]
      );
      if (userRows.length > 0) {
        userContext = {
          name: userRows[0].name,
          salary: userRows[0].salary != null ? Number(userRows[0].salary) : null,
        };
      }
    }

    // Use activeSessionId (chatId or incomingSessionId) for multi-turn session continuity
    const response = await orchestrate(
      effectiveMessage,
      activeSessionId,
      language,
      detectedLanguageCode,
      languageProbability,
      category,
      userContext,
      schemeAction
    );

    if (userId && chatId) {
      // Save assistant response to DB
      await pool.query(
        'INSERT INTO chat_messages (chat_id, role, content, type, data, quick_actions, disclaimer) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          chatId,
          'assistant',
          response.message,
          response.type,
          response.data ? JSON.stringify(response.data) : null,
          response.quickActions ? JSON.stringify(response.quickActions) : null,
          response.disclaimer || null,
        ]
      );

      // Update chat's updated_at
      await pool.query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);
    }

    res.json({ ...response, chatId: chatId || response.sessionId });
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[chat-error]', msg);
    res.status(500).json({ error: 'Internal server error', detail: msg });
  }
});

export default router;
