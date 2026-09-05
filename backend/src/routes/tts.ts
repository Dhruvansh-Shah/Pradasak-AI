import { Router, Request, Response } from 'express';
import { generateSpeech } from '../services/TTSService';

const router = Router();

// POST /api/tts
router.post('/', async (req: Request, res: Response) => {
  const { text, language } = req.body as { text?: string; language?: string };

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text parameter is required and must be a non-empty string' });
    return;
  }

  const lang = (language && typeof language === 'string' ? language : 'en').toLowerCase();
  if (lang !== 'en' && lang !== 'hi' && lang !== 'mr') {
    res.status(400).json({ error: 'language parameter must be one of "en", "hi", or "mr"' });
    return;
  }

  try {
    const audioBuffer = await generateSpeech(text, lang);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[tts-route-error]', msg);
    res.status(500).json({ error: 'Failed to generate speech audio', detail: msg });
  }
});

export default router;
