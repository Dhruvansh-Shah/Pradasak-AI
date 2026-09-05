import { Router, Request, Response } from 'express';
import multer from 'multer';
import { transcribeSpeech } from '../services/STTService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
});

// POST /api/stt
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Audio file is required under the "audio" form field' });
    return;
  }

  const languageParam = (req.body?.language || req.body?.languageCode || 'unknown') as string;

  try {
    const result = await transcribeSpeech(
      req.file.buffer,
      req.file.originalname || 'recording.webm',
      req.file.mimetype || 'audio/webm',
      languageParam
    );

    res.json({
      transcript: result.transcript,
      detectedLanguageCode: result.languageCode,
      languageProbability: result.languageProbability,
    });
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[stt-route-error]', msg);
    res.status(500).json({ error: 'Failed to transcribe audio speech', detail: msg });
  }
});

export default router;
