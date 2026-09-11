import { Router, Request, Response } from 'express';
import { process as orchestrate } from '../services/ChatOrchestrator';
import type { SchemeActionPayload } from '../services/ChatOrchestrator';
import { pool } from '../db/pool';
import { optionalUser, UserAuthRequest } from '../middleware/userAuthMiddleware';
import { generateChatId, autoTitle } from './chats';
import { UserProfileContext, getOrCreate, hydrateSessionHistory } from '../services/ConversationSession';

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
    history,
  } = req.body as {
    message?: string;
    chatId?: string;
    sessionId?: string;
    language?: string;
    detectedLanguageCode?: string;
    languageProbability?: number;
    category?: string;
    schemeAction?: SchemeActionPayload;
    history?: { role: 'user' | 'assistant'; content: string }[];
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

  let validUserId: number | undefined = undefined;
  if (req.userId) {
    try {
      const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.userId]);
      if (rows.length > 0) {
        validUserId = req.userId;
      }
    } catch (e) {
      console.warn('[chat] user verification warning:', e);
    }
  }

  let chatId = incomingChatId;
  const activeSessionId = chatId || incomingSessionId || undefined;

  try {
    // If authenticated, persist the chat
    if (validUserId) {
      try {
        if (!chatId) {
          // Create new chat
          chatId = generateChatId();
          await pool.query(
            'INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3)',
            [chatId, validUserId, autoTitle(effectiveMessage)]
          );
        } else {
          // Verify ownership or create if not exists
          const { rows } = await pool.query('SELECT id, user_id FROM chats WHERE id = $1', [chatId]);
          if (rows.length === 0) {
            await pool.query(
              'INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3)',
              [chatId, validUserId, autoTitle(effectiveMessage)]
            );
          } else if (rows[0].user_id !== validUserId) {
            chatId = generateChatId();
            await pool.query(
              'INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3)',
              [chatId, validUserId, autoTitle(effectiveMessage)]
            );
          } else {
            // Auto-title if still "New Chat"
            const { rows: chatRows } = await pool.query('SELECT title FROM chats WHERE id = $1', [chatId]);
            if (chatRows[0]?.title === 'New Chat') {
              await pool.query('UPDATE chats SET title = $1 WHERE id = $2', [autoTitle(effectiveMessage), chatId]);
            }
          }
        }

        // Save user message to DB
        await pool.query(
          'INSERT INTO chat_messages (chat_id, role, content, type) VALUES ($1, $2, $3, $4)',
          [chatId, 'user', effectiveMessage, 'text']
        );
      } catch (dbErr) {
        console.warn('[chat] Failed to persist user message in DB:', dbErr);
      }
    }
    // Fetch complete user profile info if authenticated (Unified Context Bus)
    let userContext: UserProfileContext | undefined;
    if (validUserId) {
      const { rows: userRows } = await pool.query<{
        name: string | null;
        salary: string | number | null;
        gender: string | null;
        city: string | null;
        district: string | null;
        state: string | null;
        pincode: string | null;
        education_level: string | null;
        trade_category: string | null;
        funding_bracket: string | null;
        caste_category: string | null;
      }>(
        'SELECT name, salary, gender, city, district, state, pincode, education_level, trade_category, funding_bracket, caste_category FROM users WHERE id = $1',
        [validUserId]
      );
      if (userRows.length > 0) {
        const u = userRows[0];
        userContext = {
          name: u.name,
          salary: u.salary != null ? Number(u.salary) : null,
          gender: u.gender,
          city: u.city,
          district: u.district,
          state: u.state,
          pincode: u.pincode,
          education_level: u.education_level,
          trade_category: u.trade_category,
          funding_bracket: u.funding_bracket,
          caste_category: u.caste_category || 'SC',
        };
      }
    }

    // Hydrate session history if this is an existing chat and in-memory history is empty
    const session = getOrCreate(activeSessionId);
    if (session.conversationHistory.length === 0) {
      if (validUserId && chatId) {
        try {
          const { rows: prevMsgs } = await pool.query(
            'SELECT role, content FROM chat_messages WHERE chat_id = $1 AND content != $2 ORDER BY id ASC LIMIT 20',
            [chatId, effectiveMessage]
          );
          if (prevMsgs.length > 0) {
            hydrateSessionHistory(session, prevMsgs as any, userContext);
          }
        } catch (dbLoadErr) {
          console.warn('[chat] Error hydrating session history from DB:', dbLoadErr);
        }
      } else if (Array.isArray(history) && history.length > 0) {
        hydrateSessionHistory(session, history, userContext);
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

    if (validUserId && chatId) {
      try {
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
      } catch (dbErr) {
        console.warn('[chat] Failed to persist assistant response in DB:', dbErr);
      }
    }

    res.json({ ...response, chatId: chatId || response.sessionId });
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[chat-error]', msg);
    res.status(500).json({ error: 'Internal server error', detail: msg });
  }
});

export default router;
