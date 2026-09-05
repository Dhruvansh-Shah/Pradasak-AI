/**
 * CertificateVerifier.ts
 *
 * Robust, deterministic certificate verification service.
 *
 * Architecture:
 *   QR Pipeline (async)  ──┐
 *                          ├──> Verification Engine ──> VERIFIED / FAILED / MANUAL_REVIEW
 *   OCR Pipeline (async) ──┘
 *
 * Core Business Rules:
 *   1. CASTE: Must be a legitimate Scheduled Caste (SC) certificate.
 *             ST, OBC, EWS, General, Income, Residence -> REJECTED.
 *             Scheduled Tribe (ST) MUST NEVER pass as Scheduled Caste (SC).
 *   2. INCOME: Must be an Income Certificate.
 *              Annual family income <= 500000 -> PASS.
 *              Annual family income > 500000 -> FAIL (e.g. 7,00,000 -> FAIL).
 *   3. NAME: Completely ignored. No name matching or comparison.
 *   4. SELFIE: Completely ignored for certificate verification.
 *   5. WRONG DOC: Immediately rejected if wrong type.
 */

import path from 'path';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import jsQR from 'jsqr';
import { Jimp } from 'jimp';
import { execFile } from 'child_process';
import Tesseract from 'tesseract.js';
import { updateRegistrationSession } from './RegistrationSessionService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QrResult {
  success: boolean;
  qrDetected: boolean;
  qrDecoded: boolean;
  urls: string[];
  govUrl: string | null;
  govText: string | null;
  error: string | null;
}

interface OcrResult {
  success: boolean;
  rawText: string;
  normalizedText: string;
  detectedCategory: 'SCHEDULED_CASTE' | 'SCHEDULED_TRIBE' | 'OBC' | 'EWS' | 'INCOME_CERTIFICATE' | 'REJECTED_DOCUMENT' | 'UNKNOWN';
  authorityDetected: boolean;
  sealIndicators: boolean;
  certificateNumber: string | null;
  incomeExtracted: number | null;
  incomeFieldFound: boolean;
}

export interface VerificationResult {
  success: boolean;
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  reason: string;
  income?: number;
}

// ─── jsQR Decoder (Node.js side) ─────────────────────────────────────────────

async function decodeWithJsQr(filePath: string): Promise<string[]> {
  const decodedPayloads: string[] = [];
  try {
    const image = await Jimp.read(filePath);

    const tryDecode = (imgData: Uint8ClampedArray, width: number, height: number, label: string) => {
      try {
        const code = jsQR(imgData, width, height);
        if (code && code.data && !decodedPayloads.includes(code.data)) {
          console.log(`[jsQR Decoder] Successfully decoded on [${label}]: ${code.data.slice(0, 80)}...`);
          decodedPayloads.push(code.data);
        }
      } catch {
        // continue
      }
    };

    // Attempt 1: Direct original
    tryDecode(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height, 'original');
    if (decodedPayloads.length > 0) return decodedPayloads;

    // Attempt 2: 2x upscale
    const img2x = image.clone();
    img2x.resize({ w: image.bitmap.width * 2, h: image.bitmap.height * 2 });
    tryDecode(new Uint8ClampedArray(img2x.bitmap.data), img2x.bitmap.width, img2x.bitmap.height, '2x_upscale');
    if (decodedPayloads.length > 0) return decodedPayloads;

    // Attempt 3: 3x upscale (crucial for phone captures & low-res certs)
    const img3x = image.clone();
    img3x.resize({ w: image.bitmap.width * 3, h: image.bitmap.height * 3 });
    tryDecode(new Uint8ClampedArray(img3x.bitmap.data), img3x.bitmap.width, img3x.bitmap.height, '3x_upscale');
    if (decodedPayloads.length > 0) return decodedPayloads;

    // Attempt 4: Greyscale + contrast on 2x
    const imgContrast = image.clone();
    imgContrast.greyscale().contrast(0.25);
    imgContrast.resize({ w: image.bitmap.width * 2, h: image.bitmap.height * 2 });
    tryDecode(new Uint8ClampedArray(imgContrast.bitmap.data), imgContrast.bitmap.width, imgContrast.bitmap.height, 'contrast_2x');
    if (decodedPayloads.length > 0) return decodedPayloads;

    // Attempt 5: 4x upscale
    const img4x = image.clone();
    img4x.resize({ w: image.bitmap.width * 4, h: image.bitmap.height * 4 });
    tryDecode(new Uint8ClampedArray(img4x.bitmap.data), img4x.bitmap.width, img4x.bitmap.height, '4x_upscale');
  } catch (err: any) {
    console.warn(`[jsQR Decoder] Failed to process image with Jimp: ${err.message}`);
  }

  return decodedPayloads;
}

// ─── Python QR Decoder ───────────────────────────────────────────────────────

function callPythonQrDecoder(filePath: string): Promise<any> {
  return new Promise((resolve) => {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '../scripts/qr_decoder.py');

    console.log(`[Python QR] Running Python QR decoder for: ${filePath}`);

    execFile(pythonPath, [scriptPath, filePath], { timeout: 45000 }, (error, stdout, stderr) => {
      if (stderr) {
        for (const line of stderr.split('\n').filter(l => l.trim())) {
          console.log(`  [PyStderr] ${line.trim()}`);
        }
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        console.warn(`[Python QR] Failed to parse stdout JSON. stdout: "${stdout}"`);
        resolve({ success: false, error: 'Python QR script returned invalid JSON' });
      }
    });
  });
}

// ─── Extract Gov URL from Payloads ──────────────────────────────────────────

function extractGovUrl(payloads: string[]): string | null {
  for (const p of payloads) {
    if (!p) continue;

    const urlMatch = p.match(/https?:\/\/[a-zA-Z0-9.-]+\.gov\.in[^\s\n\r"']*/i);
    if (urlMatch && isValidGovUrl(urlMatch[0])) {
      return urlMatch[0];
    }

    const nicMatch = p.match(/https?:\/\/[a-zA-Z0-9.-]+\.nic\.in[^\s\n\r"']*/i);
    if (nicMatch && isValidGovUrl(nicMatch[0])) {
      return nicMatch[0];
    }
  }

  return null;
}

// ─── QR Pipeline ─────────────────────────────────────────────────────────────

async function runQrPipeline(filePath: string): Promise<QrResult> {
  const result: QrResult = {
    success: false,
    qrDetected: false,
    qrDecoded: false,
    urls: [],
    govUrl: null,
    govText: null,
    error: null,
  };

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    result.error = 'PDF QR extraction not supported directly';
    return result;
  }

  try {
    const [pythonResult, jsQrPayloads] = await Promise.all([
      callPythonQrDecoder(filePath),
      decodeWithJsQr(filePath),
    ]);

    const combinedPayloads: string[] = [];

    if (pythonResult.qr_detected) {
      result.qrDetected = true;
    }
    if (pythonResult.success && pythonResult.urls && Array.isArray(pythonResult.urls)) {
      result.qrDecoded = true;
      result.qrDetected = true;
      for (const u of pythonResult.urls) {
        if (u && !combinedPayloads.includes(u)) combinedPayloads.push(u);
      }
    }

    if (jsQrPayloads.length > 0) {
      result.qrDecoded = true;
      result.qrDetected = true;
      for (const u of jsQrPayloads) {
        if (u && !combinedPayloads.includes(u)) combinedPayloads.push(u);
      }
    }

    result.urls = combinedPayloads;

    if (result.qrDecoded && result.urls.length > 0) {
      console.log(`[QR Pipeline] Total decoded payloads: ${result.urls.length}`);
      result.govUrl = extractGovUrl(result.urls);

      if (result.govUrl) {
        try {
          console.log(`[QR Pipeline] Fetching official government document: ${result.govUrl}`);
          const buffer = await fetchGovDocument(result.govUrl);
          const text = await extractTextFromBuffer(buffer);
          result.govText = text;
          result.success = true;
          console.log(`[QR Pipeline] Official document parsed successfully (len=${text.length})`);
        } catch (fetchErr: any) {
          result.error = `Government document retrieval failed: ${fetchErr.message}`;
          console.warn(`[QR Pipeline] ${result.error}`);
        }
      } else {
        result.error = 'QR decoded but no official government URL (.gov.in / .nic.in) found in payload';
        console.log(`[QR Pipeline] ${result.error}`);
      }
    } else {
      if (result.qrDetected) {
        result.error = 'A QR code was detected, but we could not read its payload';
      } else {
        result.error = 'No QR code detected on certificate';
      }
      console.log(`[QR Pipeline] ${result.error}`);
    }
  } catch (err: any) {
    result.error = `QR pipeline error: ${err.message}`;
    console.error(`[QR Pipeline] Exception:`, err.message);
  }

  return result;
}

// ─── Text Normalization & Legal Boilerplate Stripping ────────────────────────

function normalizeOcrText(raw: string): string {
  let text = raw;

  // Fix common OCR typos for keywords
  text = text.replace(/\bmcome\b/gi, 'income');
  text = text.replace(/\brncome\b/gi, 'income');
  text = text.replace(/\binome\b/gi, 'income');
  text = text.replace(/\bcermbcate\b/gi, 'certificate');
  text = text.replace(/\bcerbficate\b/gi, 'certificate');
  text = text.replace(/\bcerttficate\b/gi, 'certificate');
  text = text.replace(/\bcertilicate\b/gi, 'certificate');
  text = text.replace(/\bcentincate\b/gi, 'certificate');
  text = text.replace(/\bschduled\b/gi, 'scheduled');
  text = text.replace(/\bschedwled\b/gi, 'scheduled');
  text = text.replace(/\bschedled\b/gi, 'scheduled');

  // Fix currency and number OCR artifacts (e.g. "R3 700000" or "R5. 700000" or "Rs, 700000")
  text = text.replace(/\bR[35$]\.?\s*(\d)/gi, 'Rs. $1');
  text = text.replace(/Rs\s*,\s*(\d)/gi, 'Rs. $1');
  text = text.replace(/Rs\.\s*,\s*(\d)/gi, 'Rs. $1');

  return text;
}

/**
 * Strips constitutional legal boilerplate citation that mentions both SC and ST:
 * "The Constitution (Scheduled Castes) Order, 1950 as amended by the Scheduled Castes and Scheduled Tribes Lists (Modification) Order, 1956..."
 * This prevents ST certificates from matching SC regex on the citation clause.
 */
function stripLegalBoilerplate(text: string): string {
  return text
    .replace(/the\s*constitution\s*\([^)]*\)\s*order[\s\S]*?(?:act,?|\.|\n\n|1976|1956|1950)/gi, ' ')
    .replace(/scheduled\s*castes?\s*(?:and|\/)\s*scheduled\s*tribes?[^.\n]*/gi, ' ');
}

// ─── Category & Document Classification ──────────────────────────────────────

function classifyDocument(text: string): 'SCHEDULED_CASTE' | 'SCHEDULED_TRIBE' | 'OBC' | 'EWS' | 'INCOME_CERTIFICATE' | 'REJECTED_DOCUMENT' | 'UNKNOWN' {
  const lower = text.toLowerCase();

  // 1. Check for Scheduled Tribe (ST) — Explicitly must never pass as SC
  const stPatterns = [
    /scheduled\s*tribe\s*certificate/,
    /tribe\s*certificate/,
    /tribal\s*certificate/,
    /\bst\s*certificate\b/,
    /\be-st0?\//,
    /(?:belongs?\s*to|member\s*of)\s*(?:the\s*)?[a-z\s]+(?:caste|tribe|community)?\s*which\s*is\s*recognized\s*as\s*(?:a\s*)?scheduled\s*tribe/,
    /recognized\s*as\s*(?:a\s*)?scheduled\s*tribe/,
    /(?:caste\s*)?category\s*[:=\-]?\s*st\b/,
    /community\s*[:=\-]?\s*scheduled\s*tribe/,
  ];

  for (const p of stPatterns) {
    if (p.test(lower)) {
      return 'SCHEDULED_TRIBE';
    }
  }

  // 2. Check for OBC / Other Backward Classes
  if (
    /other\s*backward\s*(?:class|classes)/.test(lower) ||
    /obc\s*certificate/.test(lower) ||
    /\be-obc\//.test(lower) ||
    /category\s*[:=\-]?\s*obc\b/.test(lower)
  ) {
    return 'OBC';
  }

  // 3. Check for EWS (Economically Weaker Section)
  if (
    /economically\s*weaker\s*section/.test(lower) ||
    /ews\s*certificate/.test(lower) ||
    /\be-ews\//.test(lower)
  ) {
    return 'EWS';
  }

  // 4. Check for Income Certificate
  if (
    /income\s*certificate/.test(lower) ||
    /\be-inc\//.test(lower) ||
    /total\s*annual\s*income/.test(lower) ||
    /annual\s*family\s*income/.test(lower) ||
    /family\s*income\s*certificate/.test(lower)
  ) {
    return 'INCOME_CERTIFICATE';
  }

  // 5. Check for Non-Certificate / Rejected Documents
  const rejectedPatterns = [
    /birth\s*certificate/,
    /death\s*certificate/,
    /driving\s*licen[sc]e/,
    /pan\s*card/,
    /permanent\s*account\s*number/,
    /voter\s*id/,
    /election\s*commission/,
    /aadhaar/,
    /unique\s*identification\s*authority/,
    /marksheet/,
    /mark\s*sheet/,
    /grade\s*card/,
    /secondary\s*school\s*examination/,
    /board\s*of\s*secondary\s*education/,
    /residen(?:ce|t)\s*certificate/,
    /domicile\s*certificate/,
    /nativity\s*certificate/,
  ];

  for (const p of rejectedPatterns) {
    if (p.test(lower)) {
      return 'REJECTED_DOCUMENT';
    }
  }

  // 6. Positive Scheduled Caste Check (on boilerplate-stripped text)
  const clean = stripLegalBoilerplate(lower);

  const scPatterns = [
    /scheduled\s*caste\s*certificate/,
    /\bsc\s*certificate\b/,
    /\be-sco\//,
    /recognized\s*as\s*(?:a\s*)?scheduled\s*caste/,
    /(?:belongs?\s*to|member\s*of)\s*(?:the\s*)?[a-z\s]+caste\s*which\s*is\s*recognized\s*as\s*(?:a\s*)?scheduled\s*caste/,
    /(?:caste\s*)?category\s*[:=\-]?\s*sc\b/,
    /community\s*[:=\-]?\s*scheduled\s*caste/,
    /\b(satnami|mahar|chamar|valmiki|meghwal|adi\s*dravida|pasi|khatik|bhangi|dhobi|balmiki)\s*caste\b/,
    /scheduled\s*caste/,
  ];

  for (const p of scPatterns) {
    if (p.test(clean)) {
      return 'SCHEDULED_CASTE';
    }
  }

  // Fallback check on general caste title
  if (/caste\s*certificate/.test(clean) && !/tribe|st\b|obc|ews/.test(clean)) {
    return 'SCHEDULED_CASTE';
  }

  return 'UNKNOWN';
}

// ─── Authority Detection ─────────────────────────────────────────────────────

function detectAuthority(lowerText: string): boolean {
  const authorityPatterns = [
    /tehsildar|tahsildar|naib\s*tehsildar/,
    /district\s*magistrate|collector/,
    /sub\s*divisional\s*(magistrate|officer)/,
    /block\s*development\s*officer/,
    /taluka\s*(?:development\s*officer|panchayat)/,
    /revenue\s*officer|revenue\s*circle/,
    /government\s*of\s*(india|[a-z]+)/,
    /e\s*-?\s*district/,
    /issuing\s*authority/,
    /competent\s*authority/,
    /office\s*of\s*the/,
    /digitally\s*signed/,
    /signature\s*of\s*the\s*revenue\s*officer/,
  ];

  for (const pattern of authorityPatterns) {
    if (pattern.test(lowerText)) return true;
  }
  return false;
}

// ─── Seal / Signature Detection ─────────────────────────────────────────────

function detectSealIndicators(lowerText: string): boolean {
  const sealPatterns = [
    /official\s*seal/, /stamp/, /embossed/,
    /signed\s*by/, /signature\s*of/, /digitally\s*signed/,
    /verified\s*by/, /authenticated/,
    /seal\s*of\s*the/, /under\s*seal/,
    /dgsign/,
  ];

  for (const pattern of sealPatterns) {
    if (pattern.test(lowerText)) return true;
  }
  return false;
}

// ─── Certificate Number Extraction ───────────────────────────────────────────

function extractCertificateNumber(text: string): string | null {
  const patterns = [
    /certificate\s*(?:case\s*)?(?:no|number|#)\s*[:=\-]?\s*([A-Z0-9\-\/]+)/i,
    /cert(?:ificate)?\s*no\.?\s*[:=\-]?\s*([A-Z0-9\-\/]+)/i,
    /(?:case|application|ref(?:erence)?)\s*(?:no|number|#)\s*[:=\-]?\s*([A-Z0-9\-\/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 4) {
      return match[1].trim();
    }
  }
  return null;
}

// ─── Income Extraction Engine ────────────────────────────────────────────────

function extractIncome(text: string): { fieldFound: boolean; value: number | null } {
  const normalized = normalizeOcrText(text);

  // 1. Indian Word Amounts (e.g. "seven lakh rupees", "4 lakh", "seven lakhs")
  const wordMultipliers: Record<string, number> = {
    'one': 100000,
    'two': 200000,
    'three': 300000,
    'four': 400000,
    'five': 500000,
    'six': 600000,
    'seven': 700000,
    'eight': 800000,
    'nine': 900000,
    'ten': 1000000,
    'fifteen': 1500000,
    'twenty': 2000000,
  };

  const wordRegex = /\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|\d+)\s+(?:rupees\s+)?lakhs?(?:\s+(?:only|rupees))?/i;
  const wordMatch = normalized.match(wordRegex);
  if (wordMatch) {
    const token = wordMatch[1].toLowerCase();
    if (wordMultipliers[token]) {
      return { fieldFound: true, value: wordMultipliers[token] };
    }
    const num = parseFloat(token);
    if (!isNaN(num) && num > 0) {
      return { fieldFound: true, value: Math.round(num * 100000) };
    }
  }

  // 2. Exact Contextual Income Regex
  const incomePatterns = [
    /(?:total\s+annual|annual\s+family|family|annual|gross|net)\s+income[^\d\n\r]{0,35}?(?:Rs[.,]?|INR|₹)?\s*(\d[\d,.]*)/i,
    /income[^\d\n\r]{0,35}?is\s+(?:Rs[.,]?|INR|₹)?\s*(\d[\d,.]*)/i,
    /total\s+annual\s+income[^\d\n\r]{0,25}?(?:Rs[.,]?|INR|₹)?\s*(\d[\d,.]*)/i,
    /(?:Rs[.,]?|₹|INR)\s*(\d[\d,.]*)\s*(?:digit\s*equals|per\s*annum|\/\-|\bonly\b)/i,
    /Total\s+([\d,]+(?:\.\d{2})?)/,
  ];

  for (const pattern of incomePatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '').split('.')[0];
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val) && val >= 1000 && val <= 100000000) {
        return { fieldFound: true, value: val };
      }
    }
  }

  // 3. Indian Thousand Word Amounts
  const thousandMap: Record<string, number> = {
    'twenty thousand': 20000,
    'thirty thousand': 30000,
    'forty thousand': 40000,
    'fifty thousand': 50000,
    'sixty thousand': 60000,
    'seventy thousand': 70000,
    'eighty thousand': 80000,
    'ninety thousand': 90000,
  };
  const lowerNorm = normalized.toLowerCase();
  for (const [phrase, amt] of Object.entries(thousandMap)) {
    if (lowerNorm.includes(phrase)) {
      return { fieldFound: true, value: amt };
    }
  }

  // 4. Fallback: Search in the vicinity of the word "income"
  if (lowerNorm.includes('income')) {
    const incomeIdx = lowerNorm.indexOf('income');
    const windowSnippet = normalized.slice(Math.max(0, incomeIdx - 80), Math.min(normalized.length, incomeIdx + 250));
    const numbers = windowSnippet.match(/\b\d{4,9}\b/g);
    if (numbers) {
      for (const numStr of numbers) {
        const val = parseInt(numStr, 10);
        // Exclude calendar years
        if (val >= 10000 && val <= 50000000 && (val < 2020 || val > 2030)) {
          return { fieldFound: true, value: val };
        }
      }
    }
  }

  return { fieldFound: false, value: null };
}

// ─── Multi-Variant OCR Pipeline ──────────────────────────────────────────────

async function runOcrPipeline(filePath: string): Promise<OcrResult> {
  const result: OcrResult = {
    success: false,
    rawText: '',
    normalizedText: '',
    detectedCategory: 'UNKNOWN',
    authorityDetected: false,
    sealIndicators: false,
    certificateNumber: null,
    incomeExtracted: null,
    incomeFieldFound: false,
  };

  try {
    const originalImage = await Jimp.read(filePath);
    console.log(`[OCR Pipeline] Original image dimensions: ${originalImage.width}x${originalImage.height}`);

    // Preprocessing Variant 1: 3x Upscaled (Resolves small text on photographed documents)
    const upscaledImage = originalImage.clone();
    const scaleFactor = originalImage.width < 1200 ? 3 : 1.5;
    upscaledImage.resize({ w: Math.round(originalImage.width * scaleFactor), h: Math.round(originalImage.height * scaleFactor) });
    const buffer1 = await upscaledImage.getBuffer('image/png');

    console.log(`[OCR Pipeline] Running Tesseract on Variant 1 (scale=${scaleFactor})...`);
    const ocr1 = await Tesseract.recognize(buffer1, 'eng', { logger: () => {} });
    let text = ocr1.data.text || '';

    // If Variant 1 text is too short, try Variant 2: Contrast Enhanced
    if (text.trim().length < 150) {
      console.log(`[OCR Pipeline] Variant 1 text short (${text.trim().length} chars). Trying Variant 2 (contrast enhanced)...`);
      const contrastImage = upscaledImage.clone();
      contrastImage.greyscale().contrast(0.25);
      const buffer2 = await contrastImage.getBuffer('image/png');
      const ocr2 = await Tesseract.recognize(buffer2, 'eng', { logger: () => {} });
      if ((ocr2.data.text || '').trim().length > text.trim().length) {
        text = ocr2.data.text || '';
      }
    }

    result.rawText = text;
    result.normalizedText = normalizeOcrText(text);
    result.success = true;

    console.log(`[OCR Pipeline] OCR Completed. Raw text length: ${result.rawText.length} characters`);
    console.log(`[OCR Pipeline] Normalized Text Preview (first 300 chars):\n${result.normalizedText.slice(0, 300)}`);

    // Classify document category
    result.detectedCategory = classifyDocument(result.normalizedText);
    console.log(`[OCR Pipeline] Detected Category: ${result.detectedCategory}`);

    // Check authority & seal
    result.authorityDetected = detectAuthority(result.normalizedText.toLowerCase());
    result.sealIndicators = detectSealIndicators(result.normalizedText.toLowerCase());
    result.certificateNumber = extractCertificateNumber(result.normalizedText);

    // Check income field
    const incomeRes = extractIncome(result.normalizedText);
    result.incomeFieldFound = incomeRes.fieldFound;
    result.incomeExtracted = incomeRes.value;

    console.log(`[OCR Pipeline] Authority: ${result.authorityDetected}, Seal: ${result.sealIndicators}`);
    console.log(`[OCR Pipeline] Income Extracted: ${result.incomeExtracted}`);

  } catch (err: any) {
    console.error(`[OCR Pipeline] Fatal Error:`, err.message);
    result.success = false;
  }

  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidGovUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const hostname = url.hostname.toLowerCase();
    if (!hostname.endsWith('.gov.in') && !hostname.endsWith('.nic.in')) return false;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchGovDocument(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxRedirects: 4,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PradarsakAI/1.0',
    },
  });
  return Buffer.from(response.data);
}

async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse(new Uint8Array(buffer));
    const result = await parser.getText();
    if (result && typeof result.text === 'string') {
      return result.text;
    }
    return '';
  } catch (err: any) {
    console.warn(`[GovDoc Parse] PDF parse failed, falling back to string: ${err.message}`);
    return buffer.toString('utf-8');
  }
}

// ─── Verification Decision: Caste Certificate ────────────────────────────────

function evaluateCasteCertificate(qr: QrResult, ocr: OcrResult): VerificationResult {
  console.log(`\n[Decision Logic: Caste] Evaluating document...`);
  console.log(`  OCR Category: ${ocr.detectedCategory}`);
  console.log(`  QR Success: ${qr.success}, Gov URL: ${qr.govUrl}`);

  // 1. Check if document is explicitly Scheduled Tribe (ST) in OCR or Government record
  const ocrIsSt = ocr.detectedCategory === 'SCHEDULED_TRIBE';
  const govIsSt = qr.govText ? classifyDocument(qr.govText) === 'SCHEDULED_TRIBE' : false;

  if (ocrIsSt || govIsSt) {
    console.log(`[Decision Logic: Caste] DISQUALIFIED: Document is a Scheduled Tribe (ST) certificate.`);
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document is a Scheduled Tribe (ST) certificate. A valid Scheduled Caste (SC) certificate is required.',
    };
  }

  // 2. Check if document is explicitly OBC, EWS, Income, or other rejected type
  if (ocr.detectedCategory === 'OBC') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document is an OBC certificate. A valid Scheduled Caste (SC) certificate is required.',
    };
  }

  if (ocr.detectedCategory === 'EWS') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document is an EWS certificate. A valid Scheduled Caste (SC) certificate is required.',
    };
  }

  if (ocr.detectedCategory === 'INCOME_CERTIFICATE') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document appears to be an Income Certificate instead of a Caste Certificate. Please upload your Scheduled Caste (SC) certificate.',
    };
  }

  if (ocr.detectedCategory === 'REJECTED_DOCUMENT') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document does not appear to be a Scheduled Caste certificate. Please upload a valid Scheduled Caste (SC) certificate.',
    };
  }

  // 3. Positive SC validation
  const ocrIsSc = ocr.detectedCategory === 'SCHEDULED_CASTE';
  const qrVerified = qr.success && qr.govUrl !== null && qr.govText !== null;
  const govIsSc = qrVerified && qr.govText ? classifyDocument(qr.govText) === 'SCHEDULED_CASTE' : false;

  console.log(`  ocrIsSc: ${ocrIsSc}, govIsSc: ${govIsSc}, qrVerified: ${qrVerified}`);

  // Strong Path: Official government record retrieved and confirms SC
  if (qrVerified && govIsSc) {
    console.log(`[Decision Logic: Caste] VERIFIED via Government official record.`);
    return {
      success: true,
      status: 'VERIFIED',
      reason: 'Your caste certificate has been successfully verified.',
    };
  }

  // QR verified and OCR confirms SC
  if (qrVerified && ocrIsSc) {
    console.log(`[Decision Logic: Caste] VERIFIED via Government source and OCR.`);
    return {
      success: true,
      status: 'VERIFIED',
      reason: 'Your caste certificate has been successfully verified.',
    };
  }

  // OCR Fallback Path: QR unavailable/failed, but OCR confirms SC format + issuing authority
  if (ocrIsSc && ocr.authorityDetected) {
    console.log(`[Decision Logic: Caste] MANUAL_REVIEW: Valid SC certificate but QR unavailable.`);
    return {
      success: false,
      status: 'MANUAL_REVIEW',
      reason: 'Your caste certificate requires manual review. Our verification team will review your document.',
    };
  }

  // If neither confirms SC
  if (!ocrIsSc && !govIsSc) {
    console.log(`[Decision Logic: Caste] FAILED: Could not establish SC status.`);
    return {
      success: false,
      status: 'FAILED',
      reason: 'We could not verify that this certificate certifies Scheduled Caste (SC) status. Please upload a valid Scheduled Caste certificate.',
    };
  }

  // Default fallback
  return {
    success: false,
    status: 'MANUAL_REVIEW',
    reason: 'We could not verify this caste certificate automatically. Sent for manual review.',
  };
}

// ─── Verification Decision: Income Certificate ───────────────────────────────

function evaluateIncomeCertificate(qr: QrResult, ocr: OcrResult): VerificationResult {
  console.log(`\n[Decision Logic: Income] Evaluating document...`);
  console.log(`  OCR Category: ${ocr.detectedCategory}`);
  console.log(`  OCR Income: ${ocr.incomeExtracted}`);
  console.log(`  QR Success: ${qr.success}, Gov URL: ${qr.govUrl}`);

  // 1. Wrong document type uploaded
  if (ocr.detectedCategory === 'SCHEDULED_CASTE' || ocr.detectedCategory === 'SCHEDULED_TRIBE' || ocr.detectedCategory === 'OBC') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document appears to be a Caste Certificate instead of an Income Certificate. Please upload your Family Income Certificate.',
    };
  }

  if (ocr.detectedCategory === 'REJECTED_DOCUMENT') {
    return {
      success: false,
      status: 'FAILED',
      reason: 'This document does not appear to be a Family Income Certificate. Please upload a valid Income Certificate.',
    };
  }

  // 2. Extract income from government document or OCR
  const qrVerified = qr.success && qr.govUrl !== null && qr.govText !== null;
  let effectiveIncome: number | null = null;

  if (qrVerified && qr.govText) {
    const govIncome = extractIncome(qr.govText);
    if (govIncome.value !== null) {
      effectiveIncome = govIncome.value;
      console.log(`  Government document income extracted: ₹${effectiveIncome.toLocaleString('en-IN')}`);
    }
  }

  if (effectiveIncome === null) {
    effectiveIncome = ocr.incomeExtracted;
    console.log(`  Using OCR income: ₹${effectiveIncome ? effectiveIncome.toLocaleString('en-IN') : 'null'}`);
  }

  // 3. Strict Eligibility Rule: annual_income <= 500000
  // If income is extracted and > 500000 (e.g. 7,00,000) -> MUST BE FAILED!
  if (effectiveIncome !== null && effectiveIncome > 500000) {
    console.log(`[Decision Logic: Income] FAILED: Income ₹${effectiveIncome.toLocaleString('en-IN')} > ₹5,00,000.`);
    return {
      success: false,
      status: 'FAILED',
      reason: `The annual family income (₹${effectiveIncome.toLocaleString('en-IN')}) exceeds the ₹5,00,000 limit.`,
      income: effectiveIncome,
    };
  }

  // 4. Strong Path: QR Verified via Government Portal + Income <= 500000
  if (qrVerified && effectiveIncome !== null && effectiveIncome <= 500000) {
    console.log(`[Decision Logic: Income] VERIFIED via Government official record (Income: ₹${effectiveIncome}).`);
    return {
      success: true,
      status: 'VERIFIED',
      reason: 'Your income certificate has been successfully verified.',
      income: effectiveIncome,
    };
  }

  // 5. OCR Fallback Path: QR unavailable/failed, but OCR confirms Income cert + income <= 500000
  if (effectiveIncome !== null && effectiveIncome <= 500000 && (ocr.authorityDetected || ocr.detectedCategory === 'INCOME_CERTIFICATE')) {
    console.log(`[Decision Logic: Income] MANUAL_REVIEW: Eligible income (₹${effectiveIncome}) but QR unavailable.`);
    return {
      success: false,
      status: 'MANUAL_REVIEW',
      reason: 'Your income certificate requires manual review. Our verification team will review your document.',
      income: effectiveIncome,
    };
  }

  // 6. Income amount could not be extracted from document
  if (effectiveIncome === null && (ocr.detectedCategory === 'INCOME_CERTIFICATE' || ocr.authorityDetected)) {
    console.log(`[Decision Logic: Income] MANUAL_REVIEW: Income document recognized but amount could not be parsed.`);
    return {
      success: false,
      status: 'MANUAL_REVIEW',
      reason: 'We could not clearly extract the income amount from this certificate. Sent for manual review.',
    };
  }

  // 7. Fallback
  return {
    success: false,
    status: 'MANUAL_REVIEW',
    reason: 'We could not verify this income certificate automatically. Sent for manual review.',
    income: effectiveIncome ?? undefined,
  };
}

// ─── Exported Entry Points ───────────────────────────────────────────────────

export async function verifyCasteCertificate(filePath: string, _fullName: string, email: string): Promise<any> {
  updateRegistrationSession(email, { casteStatus: 'VERIFYING' });
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`CASTE CERTIFICATE VERIFICATION (${email})`);
  console.log(`${'═'.repeat(60)}`);

  try {
    // Run QR and OCR pipelines IN PARALLEL
    const [qr, ocr] = await Promise.all([
      runQrPipeline(filePath),
      runOcrPipeline(filePath),
    ]);

    // Verification Decision
    const result = evaluateCasteCertificate(qr, ocr);

    console.log(`\n[Decision] Status: ${result.status}`);
    console.log(`[Decision] Reason: ${result.reason}`);

    updateRegistrationSession(email, { casteStatus: result.status });

    return {
      success: result.success,
      status: result.status,
      reason: result.reason,
    };

  } catch (err: any) {
    console.error(`[FATAL] Caste verification error:`, err);
    updateRegistrationSession(email, { casteStatus: 'MANUAL_REVIEW' });
    return {
      success: false,
      status: 'MANUAL_REVIEW',
      reason: 'An unexpected system error occurred during verification. Sent for manual review.',
    };
  }
}

export async function verifyIncomeCertificate(filePath: string, _fullName: string, email: string): Promise<any> {
  updateRegistrationSession(email, { incomeStatus: 'VERIFYING' });
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`INCOME CERTIFICATE VERIFICATION (${email})`);
  console.log(`${'═'.repeat(60)}`);

  try {
    // Run QR and OCR pipelines IN PARALLEL
    const [qr, ocr] = await Promise.all([
      runQrPipeline(filePath),
      runOcrPipeline(filePath),
    ]);

    // Verification Decision
    const result = evaluateIncomeCertificate(qr, ocr);

    console.log(`\n[Decision] Status: ${result.status}`);
    console.log(`[Decision] Reason: ${result.reason}`);
    if (result.income !== undefined) {
      console.log(`[Decision] Extracted Income: ₹${result.income.toLocaleString('en-IN')}`);
    }

    updateRegistrationSession(email, { incomeStatus: result.status });

    return {
      success: result.success,
      status: result.status,
      reason: result.reason,
      income: result.income,
    };

  } catch (err: any) {
    console.error(`[FATAL] Income verification error:`, err);
    updateRegistrationSession(email, { incomeStatus: 'MANUAL_REVIEW' });
    return {
      success: false,
      status: 'MANUAL_REVIEW',
      reason: 'An unexpected system error occurred during verification. Sent for manual review.',
    };
  }
}
