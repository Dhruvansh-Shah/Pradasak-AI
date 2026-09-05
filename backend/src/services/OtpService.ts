import bcrypt from 'bcryptjs';
import { sendVerificationOtpEmail } from './EmailService';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

interface OtpData {
  hash: string;
  expiresAt: number;
  attempts: number;
}

// In-memory stores
const otpStore = new Map<string, OtpData>();
const cooldownStore = new Map<string, number>();
const verifiedEmails = new Set<string>();

function generateSecureOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function sendOtp(email: string): Promise<void> {
  const now = Date.now();
  const lastSent = cooldownStore.get(email);
  if (lastSent && (now - lastSent < 30000)) {
    throw new Error(`Please wait ${Math.ceil((30000 - (now - lastSent))/1000)} seconds before requesting a new OTP.`);
  }

  const otp = generateSecureOTP();
  const hash = await bcrypt.hash(otp, 10);
  
  otpStore.set(email, {
    hash,
    expiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0
  });
  
  cooldownStore.set(email, now);
  verifiedEmails.delete(email);

  await sendVerificationOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const data = otpStore.get(email);
  if (!data) {
    throw new Error('OTP not found or expired');
  }
  
  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    throw new Error('This OTP has expired. Please request a new OTP.');
  }
  
  if (data.attempts >= 5) {
    otpStore.delete(email);
    throw new Error('Too many incorrect attempts. Please request a new OTP.');
  }
  
  const isValid = await bcrypt.compare(otp, data.hash);
  if (!isValid) {
    data.attempts += 1;
    otpStore.set(email, data);
    throw new Error('Incorrect OTP. Please check the code and try again.');
  }
  
  otpStore.delete(email);
  verifiedEmails.add(email);
  return true;
}

export function isEmailVerified(email: string): boolean {
  return verifiedEmails.has(email);
}

export function clearVerification(email: string): void {
  verifiedEmails.delete(email);
}
