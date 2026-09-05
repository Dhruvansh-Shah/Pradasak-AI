import { getLanguageConfig } from '../config/languages';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';

export interface STTResponse {
  transcript: string;
  languageCode: string | null;
  languageProbability: number | null;
}

export interface SarvamRawSTTResponse {
  transcript?: string;
  language_code?: string;
  language_probability?: number;
}

export function mapSarvamSTTResponse(data: SarvamRawSTTResponse): STTResponse {
  if (!data || typeof data.transcript !== 'string') {
    throw new Error('Sarvam STT API returned invalid or empty transcript response');
  }

  const rawLangCode =
    typeof data.language_code === 'string' && data.language_code.trim()
      ? data.language_code.trim()
      : null;

  const rawProbability =
    typeof data.language_probability === 'number' && !isNaN(data.language_probability)
      ? data.language_probability
      : null;

  return {
    transcript: data.transcript.trim(),
    languageCode: rawLangCode,
    languageProbability: rawProbability,
  };
}

export async function transcribeSpeech(
  audioBuffer: Buffer,
  fileName: string = 'recording.webm',
  mimeType: string = 'audio/webm',
  language: string = 'unknown'
): Promise<STTResponse> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the backend');
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio file buffer is empty');
  }

  let targetLanguageCode = 'unknown';
  if (language && language !== 'unknown' && language !== 'auto') {
    const langConfig = getLanguageConfig(language);
    if (langConfig) {
      targetLanguageCode = langConfig.sarvamSttCode;
    } else {
      targetLanguageCode = language;
    }
  }

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

  const data = (await response.json()) as SarvamRawSTTResponse;

  return mapSarvamSTTResponse(data);
}
