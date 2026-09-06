import bcrypt from 'bcryptjs';
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail } from './EmailService';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

interface OtpData {
  hash: string;
  expiresAt: number;
  attempts: number;
}

// In-memory stores for registration
const otpStore = new Map<string, OtpData>();
const cooldownStore = new Map<string, number>();
const verifiedEmails = new Set<string>();

// In-memory stores for password reset (isolated to prevent crossover attacks)
const passwordResetOtpStore = new Map<string, OtpData>();
const passwordResetCooldownStore = new Map<string, number>();

function generateSecureOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function sendOtp(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const lastSent = cooldownStore.get(normalizedEmail);
  if (lastSent && (now - lastSent < 30000)) {
    throw new Error(`Please wait ${Math.ceil((30000 - (now - lastSent))/1000)} seconds before requesting a new OTP.`);
  }

  const otp = generateSecureOTP();
  const hash = await bcrypt.hash(otp, 10);
  
  otpStore.set(normalizedEmail, {
    hash,
    expiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0
  });
  
  cooldownStore.set(normalizedEmail, now);
  verifiedEmails.delete(normalizedEmail);

  await sendVerificationOtpEmail(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const data = otpStore.get(normalizedEmail);
  if (!data) {
    throw new Error('OTP not found or expired');
  }
  
  if (Date.now() > data.expiresAt) {
    otpStore.delete(normalizedEmail);
    throw new Error('This OTP has expired. Please request a new OTP.');
  }
  
  if (data.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    throw new Error('Too many incorrect attempts. Please request a new OTP.');
  }
  
  const isValid = await bcrypt.compare(otp, data.hash);
  if (!isValid) {
    data.attempts += 1;
    otpStore.set(normalizedEmail, data);
    throw new Error('Incorrect OTP. Please check the code and try again.');
  }
  
  otpStore.delete(normalizedEmail);
  verifiedEmails.add(normalizedEmail);
  return true;
}

export function isEmailVerified(email: string): boolean {
  return verifiedEmails.has(email.toLowerCase().trim());
}

export function clearVerification(email: string): void {
  verifiedEmails.delete(email.toLowerCase().trim());
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PASSWORD RESET OTP FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendPasswordResetOtp(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const lastSent = passwordResetCooldownStore.get(normalizedEmail);
  if (lastSent && (now - lastSent < 30000)) {
    throw new Error(`Please wait ${Math.ceil((30000 - (now - lastSent))/1000)} seconds before requesting a new OTP.`);
  }

  const otp = generateSecureOTP();
  const hash = await bcrypt.hash(otp, 10);
  
  passwordResetOtpStore.set(normalizedEmail, {
    hash,
    expiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0
  });
  
  passwordResetCooldownStore.set(normalizedEmail, now);

  await sendPasswordResetOtpEmail(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
}

export async function verifyPasswordResetOtp(email: string, otp: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const data = passwordResetOtpStore.get(normalizedEmail);
  if (!data) {
    throw new Error('OTP not found or expired');
  }
  
  if (Date.now() > data.expiresAt) {
    passwordResetOtpStore.delete(normalizedEmail);
    throw new Error('This OTP has expired. Please request a new one.');
  }
  
  if (data.attempts >= 5) {
    passwordResetOtpStore.delete(normalizedEmail);
    throw new Error('Too many incorrect attempts. Please request a new OTP.');
  }
  
  const isValid = await bcrypt.compare(otp, data.hash);
  if (!isValid) {
    data.attempts += 1;
    passwordResetOtpStore.set(normalizedEmail, data);
    throw new Error('The OTP you entered is incorrect. Please try again.');
  }
  
  // Single-use guarantee: Invalidate OTP once verified
  passwordResetOtpStore.delete(normalizedEmail);
  return true;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST HELPERS
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function _setTestPasswordResetOtp(
  email: string,
  otp: string,
  expiresInMs: number = OTP_EXPIRY_MINUTES * 60 * 1000,
  attempts: number = 0
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const hash = await bcrypt.hash(otp, 10);
  passwordResetOtpStore.set(normalizedEmail, {
    hash,
    expiresAt: Date.now() + expiresInMs,
    attempts,
  });
}

export function _getTestPasswordResetOtpData(email: string) {
  return passwordResetOtpStore.get(email.toLowerCase().trim());
}

export function _clearTestPasswordResetData(email: string): void {
  const normalized = email.toLowerCase().trim();
  passwordResetOtpStore.delete(normalized);
  passwordResetCooldownStore.delete(normalized);
}

