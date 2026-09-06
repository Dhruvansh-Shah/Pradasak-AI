import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool';
import bcrypt from 'bcryptjs';
import { verifyCasteCertificate, verifyIncomeCertificate } from '../services/CertificateVerifier';
import { getRegistrationSession, clearRegistrationSession } from '../services/RegistrationSessionService';
import { sendOtp, verifyOtp, isEmailVerified, clearVerification } from '../services/OtpService';
import { sendRegistrationSuccessEmail } from '../services/EmailService';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/upload-docs', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'sc_certificate', maxCount: 1 },
  { name: 'income_certificate', maxCount: 1 }
]), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const selfie = files['selfie']?.[0]?.filename || null;
    const scCert = files['sc_certificate']?.[0]?.filename || null;
    const incomeCert = files['income_certificate']?.[0]?.filename || null;

    res.json({ selfie, sc_certificate: scCert, income_certificate: incomeCert });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

router.post('/verify-caste', async (req: Request, res: Response): Promise<void> => {
  const { sc_certificate, full_name, email } = req.body;
  if (!sc_certificate || !full_name || !email) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }
  const scPath = path.join(uploadDir, sc_certificate);
  if (!fs.existsSync(scPath)) {
    res.status(400).json({ success: false, error: 'File not found' });
    return;
  }
  const result = await verifyCasteCertificate(scPath, full_name, email);
  res.json(result);
});

router.post('/verify-income', async (req: Request, res: Response): Promise<void> => {
  const { income_certificate, full_name, email } = req.body;
  if (!income_certificate || !full_name || !email) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }
  const incomePath = path.join(uploadDir, income_certificate);
  if (!fs.existsSync(incomePath)) {
    res.status(400).json({ success: false, error: 'File not found' });
    return;
  }
  const result = await verifyIncomeCertificate(incomePath, full_name, email);
  res.json(result);
});

router.post('/send-email-otp', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  try {
    await sendOtp(email.toLowerCase().trim());
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send OTP' });
  }
});

router.post('/verify-email-otp', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: 'Email and OTP are required' });
    return;
  }
  try {
    await verifyOtp(email.toLowerCase().trim(), otp);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

router.post('/complete', async (req: Request, res: Response): Promise<void> => {
  const {
    full_name, dob, gender, mobile, email,
    address_line1, address_line2, city, district, state, pincode,
    selfie_image, sc_certificate_file, income_certificate_file, aadhaar,
    password, eligibility_status,
    education_level, trade_category, funding_bracket, caste_category
  } = req.body;

  if (!full_name || !mobile || !password) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const emailStr = email ? email.toLowerCase().trim() : '';
    
    if (!isEmailVerified(emailStr)) {
      res.status(400).json({ error: 'Email has not been verified.' });
      return;
    }

    const session = getRegistrationSession(emailStr);
    if (session.casteStatus !== 'VERIFIED' || session.incomeStatus !== 'VERIFIED') {
      res.status(400).json({ error: 'CERTIFICATES_NOT_VERIFIED' });
      return;
    }

    const resolvedSalary = req.body.salary ? Number(req.body.salary) : (session.extractedIncome || null);

    const { rows } = await pool.query(`
      INSERT INTO users (
        name, phone, email, password_hash, dob, gender,
        mobile_verified, email_verified,
        address_line1, address_line2, city, district, state, pincode,
        selfie_image, sc_certificate_file, income_certificate_file, aadhaar,
        eligibility_status, registration_complete, salary,
        education_level, trade_category, funding_bracket, caste_category
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        true, false,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, true, $18,
        $19, $20, $21, $22
      ) RETURNING id, name, email, phone, salary, eligibility_status, education_level, trade_category, funding_bracket, caste_category
    `, [
      full_name, mobile, emailStr, passwordHash, dob || null, gender || null,
      address_line1 || null, address_line2 || null, city || null, district || null, state || null, pincode || null,
      selfie_image || null, sc_certificate_file || null, income_certificate_file || null, aadhaar || null,
      eligibility_status || 'pending_manual_review',
      resolvedSalary,
      education_level || null, trade_category || null, funding_bracket || null, caste_category || 'SC'
    ]);

    const user = rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    clearVerification(emailStr);
    clearRegistrationSession(emailStr);
    
    // Asynchronously dispatch the registration completion email to the OTP-verified email address
    // Failure handling: Account is already successfully created, so email delivery failures are logged safely
    sendRegistrationSuccessEmail({
      fullName: full_name,
      email: emailStr,
      mobile,
      dob: dob || null,
      gender: gender || null,
      addressLine1: address_line1 || null,
      addressLine2: address_line2 || null,
      city: city || null,
      district: district || null,
      state: state || null,
      pincode: pincode || null,
      salary: resolvedSalary,
      eligibilityStatus: eligibility_status || 'verified',
      scCertificateFile: sc_certificate_file || null,
      incomeCertificateFile: income_certificate_file || null,
      selfieImage: selfie_image || null,
    }).catch((emailErr) => {
      console.error('[PradarshakAI EmailService] Background email sending error:', emailErr?.message || emailErr);
    });

    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.message.includes('unique')) {
      res.status(409).json({ error: 'An account with this email/phone already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
  }
});

export default router;
