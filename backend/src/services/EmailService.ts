import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Strict Brand Name Requirement
export const BRAND_NAME = 'PradarshakAI';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'no-reply@pradarshakai.gov.in';

const uploadDir = path.join(__dirname, '../../uploads');

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

export interface RegistrationEmailData {
  fullName: string;
  email: string;
  mobile: string;
  dob?: string | null;
  gender?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  salary?: number | null;
  eligibilityStatus?: string | null;
  scCertificateFile?: string | null;
  incomeCertificateFile?: string | null;
  selfieImage?: string | null;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. EMAIL VERIFICATION / OTP EMAIL
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendVerificationOtpEmail(to: string, otp: string, expiryMinutes: number = 5): Promise<void> {
  const subject = `${BRAND_NAME} – Verify Your Email Address`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 6px 24px rgba(11,31,58,0.08); border:1px solid #e2e8f0;">
          
          <!-- Government / Institutional Header -->
          <tr>
            <td style="background-color:#001e40; padding:28px 32px 24px; text-align:center; border-bottom:4px solid #fe9832;">
              <div style="color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.02em; margin-bottom:4px;">
                ${BRAND_NAME}
              </div>
              <div style="color:#cbd5e1; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:0.04em;">
                National SC Finance & Development Corporation • Government of India
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 16px; color:#0b1f3a; font-size:20px; font-weight:800; letter-spacing:-0.01em;">
                Verify Your Email Address
              </h1>

              <p style="margin:0 0 16px; color:#334155; font-size:14.5px; line-height:1.6;">
                Dear User,
              </p>

              <p style="margin:0 0 20px; color:#334155; font-size:14.5px; line-height:1.6;">
                Thank you for registering with <strong>${BRAND_NAME}</strong>.
              </p>

              <p style="margin:0 0 24px; color:#334155; font-size:14.5px; line-height:1.6;">
                To verify your email address and continue with your registration, please use the One-Time Password (OTP) below:
              </p>

              <!-- Prominent OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block; background-color:#f8fafc; border:2px dashed #003366; border-radius:12px; padding:18px 36px; text-align:center;">
                      <div style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">
                        One-Time Password (OTP)
                      </div>
                      <div style="color:#001e40; font-family:'Courier New', Courier, monospace; font-size:36px; font-weight:900; letter-spacing:8px; line-height:1;">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:14px 16px; margin:24px 0 20px;">
                <tr>
                  <td>
                    <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">
                      ⏱ <strong>Validity:</strong> This OTP is valid for <strong>${expiryMinutes} minutes</strong>. Please do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px; color:#64748b; font-size:13px; line-height:1.6;">
                If you did not initiate this registration, you may safely ignore this email. No changes will be made to your account.
              </p>

              <div style="border-top:1px solid #e2e8f0; margin-top:28px; padding-top:20px;">
                <p style="margin:0; color:#0b1f3a; font-size:13.5px; font-weight:700;">
                  Warm regards,<br>
                  <span style="color:#475569; font-weight:500;">${BRAND_NAME} Support Team</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- System Generated Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 8px; color:#64748b; font-size:12px; font-weight:600; line-height:1.4;">
                This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
              </p>
              <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.4;">
                © ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${BRAND_NAME} – Verify Your Email Address

Dear User,

Thank you for registering with ${BRAND_NAME}.

To verify your email address and continue with your registration, please use the One-Time Password (OTP) below:

OTP: ${otp}

This OTP is valid for ${expiryMinutes} minutes. Please do not share this OTP with anyone.

If you did not initiate this registration, you may safely ignore this email.

--------------------------------------------------
This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
© ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
  `.trim();

  await transporter.sendMail({
    from: `"${BRAND_NAME}" <${SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PASSWORD RESET OTP EMAIL
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendPasswordResetOtpEmail(to: string, otp: string, expiryMinutes: number = 5): Promise<void> {
  const subject = `${BRAND_NAME} – Password Reset Verification Code`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 6px 24px rgba(11,31,58,0.08); border:1px solid #e2e8f0;">
          
          <!-- Government / Institutional Header -->
          <tr>
            <td style="background-color:#001e40; padding:28px 32px 24px; text-align:center; border-bottom:4px solid #fe9832;">
              <div style="color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.02em; margin-bottom:4px;">
                ${BRAND_NAME}
              </div>
              <div style="color:#cbd5e1; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:0.04em;">
                National SC Finance & Development Corporation • Government of India
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 16px; color:#0b1f3a; font-size:20px; font-weight:800; letter-spacing:-0.01em;">
                Password Reset Verification Code
              </h1>

              <p style="margin:0 0 16px; color:#334155; font-size:14.5px; line-height:1.6;">
                Dear User,
              </p>

              <p style="margin:0 0 20px; color:#334155; font-size:14.5px; line-height:1.6;">
                We received a request to reset your password for your <strong>${BRAND_NAME}</strong> account.
              </p>

              <p style="margin:0 0 24px; color:#334155; font-size:14.5px; line-height:1.6;">
                To verify your identity and create a new password, please use the One-Time Password (OTP) below:
              </p>

              <!-- Prominent OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block; background-color:#f8fafc; border:2px dashed #003366; border-radius:12px; padding:18px 36px; text-align:center;">
                      <div style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">
                        Password Reset Code (OTP)
                      </div>
                      <div style="color:#001e40; font-family:'Courier New', Courier, monospace; font-size:36px; font-weight:900; letter-spacing:8px; line-height:1;">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:14px 16px; margin:24px 0 20px;">
                <tr>
                  <td>
                    <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">
                      ⏱ <strong>Validity:</strong> This OTP is valid for <strong>${expiryMinutes} minutes</strong>. Please do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px; color:#64748b; font-size:13px; line-height:1.6;">
                If you did not request a password reset, you may safely ignore this email. Your current password will remain unchanged.
              </p>

              <div style="border-top:1px solid #e2e8f0; margin-top:28px; padding-top:20px;">
                <p style="margin:0; color:#0b1f3a; font-size:13.5px; font-weight:700;">
                  Warm regards,<br>
                  <span style="color:#475569; font-weight:500;">${BRAND_NAME} Support Team</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- System Generated Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 8px; color:#64748b; font-size:12px; font-weight:600; line-height:1.4;">
                This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
              </p>
              <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.4;">
                © ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${BRAND_NAME} – Password Reset Verification Code

Dear User,

We received a request to reset your password for your ${BRAND_NAME} account.

To verify your identity and choose a new password, please use the One-Time Password (OTP) below:

OTP: ${otp}

This OTP is valid for ${expiryMinutes} minutes. Please do not share this OTP with anyone.

If you did not request a password reset, you may safely ignore this email.

--------------------------------------------------
This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
© ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
  `.trim();

  await transporter.sendMail({
    from: `"${BRAND_NAME}" <${SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. REGISTRATION COMPLETION EMAIL
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendRegistrationSuccessEmail(data: RegistrationEmailData): Promise<boolean> {
  const subject = `${BRAND_NAME} – Registration Successfully Completed`;

  // Prepare safe, non-sensitive attachments from uploaded files
  const attachments: Array<{ filename: string; path: string }> = [];

  try {
    if (data.scCertificateFile) {
      const fullPath = path.join(uploadDir, data.scCertificateFile);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(data.scCertificateFile) || '.jpg';
        attachments.push({
          filename: `Scheduled_Caste_Certificate${ext}`,
          path: fullPath,
        });
      }
    }

    if (data.incomeCertificateFile) {
      const fullPath = path.join(uploadDir, data.incomeCertificateFile);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(data.incomeCertificateFile) || '.jpg';
        attachments.push({
          filename: `Income_Certificate${ext}`,
          path: fullPath,
        });
      }
    }

    if (data.selfieImage) {
      const fullPath = path.join(uploadDir, data.selfieImage);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(data.selfieImage) || '.jpg';
        attachments.push({
          filename: `Profile_Photo${ext}`,
          path: fullPath,
        });
      }
    }
  } catch (attErr) {
    console.warn(`[${BRAND_NAME} EmailService] Warning resolving file attachments:`, attErr);
  }

  // Format non-sensitive address string
  const addressParts = [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.district,
    data.state ? `${data.state}${data.pincode ? ' - ' + data.pincode : ''}` : (data.pincode ? `PIN: ${data.pincode}` : '')
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';
  const formattedIncome = data.salary ? `₹${Number(data.salary).toLocaleString('en-IN')} / year` : 'Verified (≤ ₹5,00,000)';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(11,31,58,0.08); border:1px solid #e2e8f0;">
          
          <!-- Government Institutional Header -->
          <tr>
            <td style="background-color:#001e40; padding:28px 32px 24px; text-align:center; border-bottom:4px solid #fe9832;">
              <div style="color:#ffffff; font-size:25px; font-weight:800; letter-spacing:-0.02em; margin-bottom:4px;">
                ${BRAND_NAME}
              </div>
              <div style="color:#cbd5e1; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:0.04em;">
                National SC Finance & Development Corporation • Government of India
              </div>
            </td>
          </tr>

          <!-- Success Banner Strip -->
          <tr>
            <td style="background-color:#ecfdf5; border-bottom:1px solid #a7f3d0; padding:14px 32px; text-align:center;">
              <div style="display:inline-block; color:#065f46; font-size:13.5px; font-weight:700;">
                ✓ Registration Successfully Completed & Verified
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 16px; color:#0b1f3a; font-size:16px; font-weight:700;">
                Dear ${data.fullName || 'Citizen'},
              </p>

              <p style="margin:0 0 16px; color:#334155; font-size:14.5px; line-height:1.65;">
                Congratulations! Your registration with <strong>${BRAND_NAME}</strong> has been successfully completed. Your digital identity, caste certificate, and family income verification records have been established.
              </p>

              <p style="margin:0 0 28px; color:#334155; font-size:14.5px; line-height:1.65;">
                <strong>${BRAND_NAME}</strong> is an official initiative designed to empower Scheduled Caste citizens, entrepreneurs, and students by simplifying access to concessional credit schemes, institutional channel partners, and government welfare programs.
              </p>

              <!-- WHAT PRADARSHAKAI CAN HELP YOU WITH -->
              <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:22px 24px; margin-bottom:30px;">
                <h2 style="margin:0 0 14px; color:#001e40; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">
                  What ${BRAND_NAME} Can Help You With
                </h2>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-bottom:12px; vertical-align:top; width:22px; color:#059669; font-weight:bold; font-size:16px;">✓</td>
                    <td style="padding-bottom:12px; padding-left:8px; color:#334155; font-size:13.5px; line-height:1.55;">
                      <strong>Find relevant government schemes easily:</strong> Discover official concessional programs and financial assistance tailored to your profile and requirements without manually sifting through numerous portals.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px; vertical-align:top; width:22px; color:#059669; font-weight:bold; font-size:16px;">✓</td>
                    <td style="padding-bottom:12px; padding-left:8px; color:#334155; font-size:13.5px; line-height:1.55;">
                      <strong>Understand scheme eligibility:</strong> Clearly review subsidized interest rates (4%–8% p.a.), loan coverage limits, moratorium grace periods, and key eligibility requirements.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px; vertical-align:top; width:22px; color:#059669; font-weight:bold; font-size:16px;">✓</td>
                    <td style="padding-bottom:12px; padding-left:8px; color:#334155; font-size:13.5px; line-height:1.55;">
                      <strong>Find potential partners and opportunities:</strong> Discover nominated State Channelising Agencies (SCAs), Public Sector Banks, Regional Rural Banks, and NBFC-MFIs in your district.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px; vertical-align:top; width:22px; color:#059669; font-weight:bold; font-size:16px;">✓</td>
                    <td style="padding-bottom:12px; padding-left:8px; color:#334155; font-size:13.5px; line-height:1.55;">
                      <strong>Connect and contact relevant organizations:</strong> Access verified branch addresses, nodal officer contact points, and official routing guidelines to confidently proceed with next steps.
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top; width:22px; color:#059669; font-weight:bold; font-size:16px;">✓</td>
                    <td style="padding-left:8px; color:#334155; font-size:13.5px; line-height:1.55;">
                      <strong>Make the overall process easier:</strong> Calculate exact monthly EMIs, plan repayment budgets, and navigate concessional finance transparently with continuous multilingual AI support.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- YOUR REGISTRATION DETAILS -->
              <div style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:30px;">
                <div style="background-color:#0b1f3a; color:#ffffff; padding:12px 20px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">
                  Your Verified Registration Details
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:14px 20px;">
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; width:40%;">Full Name</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:700;">${data.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Mobile Number</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:600; border-top:1px solid #f1f5f9;">+91 ${data.mobile}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Verified Email</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:600; border-top:1px solid #f1f5f9;">${data.email}</td>
                  </tr>
                  ${data.dob ? `
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Date of Birth</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:600; border-top:1px solid #f1f5f9;">${data.dob}</td>
                  </tr>
                  ` : ''}
                  ${data.gender ? `
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Gender</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:600; border-top:1px solid #f1f5f9;">${data.gender}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Residential Address</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:600; border-top:1px solid #f1f5f9;">${formattedAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Verified Annual Income</td>
                    <td style="padding:7px 0; color:#0f172a; font-size:13.5px; font-weight:700; border-top:1px solid #f1f5f9;">${formattedIncome}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0; color:#64748b; font-size:13px; border-top:1px solid #f1f5f9;">Eligibility Status</td>
                    <td style="padding:7px 0; color:#059669; font-size:13.5px; font-weight:700; border-top:1px solid #f1f5f9;">Scheduled Caste (Verified)</td>
                  </tr>
                </table>
              </div>

              <!-- YOUR SUBMITTED DOCUMENTS -->
              <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:18px 20px; margin-bottom:30px;">
                <h3 style="margin:0 0 8px; color:#166534; font-size:13.5px; font-weight:800; text-transform:uppercase;">
                  📎 Your Submitted Documents
                </h3>
                <p style="margin:0 0 10px; color:#14532d; font-size:13px; line-height:1.5;">
                  Your uploaded certificates and captured profile photo are attached to this email for your permanent records:
                </p>
                <ul style="margin:0; padding-left:20px; color:#166534; font-size:12.5px; line-height:1.6;">
                  ${attachments.length > 0
                    ? attachments.map(att => `<li><strong>${att.filename}</strong></li>`).join('')
                    : '<li>Official verification certificates on file</li>'
                  }
                </ul>
              </div>

              <!-- WHAT'S NEXT -->
              <div style="text-align:center; padding:10px 0 20px;">
                <h3 style="margin:0 0 10px; color:#0b1f3a; font-size:16px; font-weight:800;">
                  What's Next?
                </h3>
                <p style="margin:0 0 20px; color:#475569; font-size:14px; line-height:1.5;">
                  You can now sign in to ${BRAND_NAME} to explore available schemes, calculate exact repayment schedules, and connect with channel partners.
                </p>
                <a href="http://localhost:3000/auth" style="display:inline-block; background-color:#fe9832; color:#001e40; font-size:14px; font-weight:800; text-decoration:none; padding:13px 32px; border-radius:8px; box-shadow:0 4px 12px rgba(254,152,50,0.3);">
                  Sign In to ${BRAND_NAME}
                </a>
              </div>

              <div style="border-top:1px solid #e2e8f0; margin-top:20px; padding-top:18px;">
                <p style="margin:0; color:#0b1f3a; font-size:13.5px; font-weight:700;">
                  Warm regards,<br>
                  <span style="color:#475569; font-weight:500;">${BRAND_NAME} Team</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- System Generated Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 8px; color:#64748b; font-size:12px; font-weight:600; line-height:1.4;">
                This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
              </p>
              <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.4;">
                © ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${BRAND_NAME} – Registration Successfully Completed

Dear ${data.fullName || 'Citizen'},

Congratulations! Your registration with ${BRAND_NAME} has been successfully completed.

${BRAND_NAME} is an official initiative designed to empower Scheduled Caste citizens, entrepreneurs, and students by simplifying access to concessional credit schemes, institutional channel partners, and government welfare programs.

WHAT ${BRAND_NAME.toUpperCase()} CAN HELP YOU WITH:
- Find relevant government schemes easily: Discover official programs tailored to your profile without manually searching across portals.
- Understand scheme eligibility: View subsidized interest rates (4%–8% p.a.), loan limits, grace periods, and key requirements.
- Find potential partners and opportunities: Discover nominated SCAs, Public Sector Banks, RRBs, and NBFC-MFIs in your district.
- Connect and contact relevant organizations: Access verified branch addresses and nodal officer contact guidelines.
- Make the overall process easier: Calculate exact EMIs and plan repayment budgets with multilingual AI assistance.

YOUR REGISTRATION DETAILS:
- Full Name: ${data.fullName}
- Mobile Number: +91 ${data.mobile}
- Verified Email: ${data.email}
${data.dob ? `- Date of Birth: ${data.dob}\n` : ''}${data.gender ? `- Gender: ${data.gender}\n` : ''}- Residential Address: ${formattedAddress}
- Annual Family Income: ${formattedIncome}
- Eligibility Status: Scheduled Caste (Verified)

YOUR SUBMITTED DOCUMENTS:
Your uploaded documents and captured profile photo are attached to this email for your records:
${attachments.length > 0 ? attachments.map(a => `• ${a.filename}`).join('\n') : '• Official verification certificates on file'}

WHAT'S NEXT?
You can now sign in to ${BRAND_NAME} and explore the available schemes, opportunities, partners, and relevant support.
Sign in at: http://localhost:3000/auth

--------------------------------------------------
This is a system-generated email from ${BRAND_NAME}. Please do not reply to this email.
© ${new Date().getFullYear()} ${BRAND_NAME} • Ministry of Social Justice & Empowerment, Government of India
  `.trim();

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${SMTP_FROM}>`,
      to: data.email,
      subject,
      text,
      html,
      attachments,
    });
    console.log(`[${BRAND_NAME} EmailService] Registration completion email sent successfully to: ${data.email}`);
    return true;
  } catch (err: any) {
    // Failure handling requirement: Log safely, do NOT expose credentials, do NOT crash registration
    console.error(`[${BRAND_NAME} EmailService] Failed to send registration completion email to ${data.email}:`, err.message || err);
    return false;
  }
}
