const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  'en-in': 'en-IN',
  'hi-in': 'hi-IN',
  'mr-in': 'mr-IN',
};

export interface STTResponse {
  transcript: string;
  languageCode: string;
}

export async function transcribeSpeech(
  audioBuffer: Buffer,
  fileName: string = 'recording.webm',
  mimeType: string = 'audio/webm',
  language: string = 'en'
): Promise<STTResponse> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the backend');
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio file buffer is empty');
  }

  const normalizedLang = language ? language.toLowerCase() : 'en';
  const targetLanguageCode = LANG_MAP[normalizedLang] || LANG_MAP.en;

  const audioFile = new File([new Uint8Array(audioBuffer)], fileName, { type: mimeType });

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  formData.append('language_code', targetLanguageCode);

  const response = await fetch(SARVAM_STT_URL, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Sarvam STT API request failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as { transcript?: string; language_code?: string };

  if (!data || typeof data.transcript !== 'string') {
    throw new Error('Sarvam STT API returned invalid or empty transcript response');
  }

  return {
    transcript: data.transcript.trim(),
    languageCode: data.language_code || targetLanguageCode,
  };
}
