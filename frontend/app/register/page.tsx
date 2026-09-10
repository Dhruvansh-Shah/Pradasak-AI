'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import CameraCapture from '@/components/CameraCapture';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, FileImage, RefreshCw, AlertTriangle } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : 'http://localhost:4000';

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Puducherry','Jammu & Kashmir',
  'Ladakh','Chandigarh','Dadra & Nagar Haveli','Andaman & Nicobar Islands','Lakshadweep',
];

const EDUCATION_LEVELS = [
  { id: 'school', label: 'Schooling / Matriculate', desc: '10th / 12th Pass, Basic Literacy' },
  { id: 'diploma', label: 'Vocational Diploma / ITI', desc: 'Polytechnic, ITI or Technical Cert' },
  { id: 'undergraduate', label: 'Graduate / Bachelor’s', desc: 'B.A, B.Sc, B.Com, B.Tech, etc.' },
  { id: 'postgraduate', label: 'Postgraduate / Professional', desc: 'M.A, M.Sc, MBA, MBBS, LLB, etc.' },
];

const TRADE_CATEGORIES = [
  { id: 'retail_shop', icon: '🏪', label: 'Retail & Kirana Store', desc: 'Grocery, general store, provisions, daily consumer goods' },
  { id: 'tailoring_garments', icon: '🧵', label: 'Tailoring & Garments', desc: 'Boutique, readymade apparel, garment manufacturing' },
  { id: 'agriculture_allied', icon: '🐄', label: 'Dairy & Agri Allied', desc: 'Dairy farming, poultry, cold storage, farm value-add' },
  { id: 'transport_logistics', icon: '🚚', label: 'Transport & Logistics', desc: 'Auto-rickshaw, commercial delivery EV, light transport' },
  { id: 'it_technical_services', icon: '💻', label: 'IT & Tech Services', desc: 'Mobile servicing, computer hardware, electronics, DTP' },
  { id: 'artisans_handicrafts', icon: '🎨', label: 'Artisans & Handicrafts', desc: 'Leather goods, pottery, handloom, wooden crafts' },
  { id: 'education_training', icon: '🎓', label: 'Education & Training', desc: 'Vocational coaching, higher education, skill development' },
  { id: 'sanitation_green_business', icon: '♻️', label: 'Sanitation & Green Biz', desc: 'Solar installation, solid waste recycling, sanitation unit' },
];

const FUNDING_BRACKETS = [
  { id: 'MICRO_UNDER_1_4L', icon: '🪙', label: 'Micro Finance (≤ ₹1.40 Lakh)', desc: 'Micro Credit Finance (MCF), Mahila Samriddhi Yojana (MSY)' },
  { id: 'SMALL_1_4_TO_15L', icon: '💼', label: 'Small Business (₹1.40L – ₹15 Lakh)', desc: 'Shilpi Samriddhi, Green Business Scheme (GBS), Transport' },
  { id: 'MEDIUM_15_TO_50L', icon: '🏭', label: 'Term Loan Enterprise (₹15L – ₹50 Lakh)', desc: 'Flagship Term Loan (TL) for commercial enterprise units' },
  { id: 'EDUCATION_VOCATIONAL', icon: '📚', label: 'Education Loan (Up to ₹20L / ₹30L)', desc: 'Concessional student loan for premier Indian & overseas courses' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  background: '#f8fafc',
  outline: 'none',
  fontSize: 14,
  color: '#0f172a',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
  display: 'block',
  marginBottom: 6,
};

const sectionStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: '28px 32px',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
  border: '1px solid #e2e8f0',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: '#001e40',
  borderBottom: '1.5px solid #f1f5f9',
  paddingBottom: 12,
  marginBottom: 20,
  marginTop: 0,
};

type CertStatus = 'IDLE' | 'UPLOADING' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Loading…</div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();

  // Basic Details
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSc, setIsSc] = useState(false);
  const [isLowIncome, setIsLowIncome] = useState(false);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Onboarding Intent (SIH PS 26092 Pre-Qualification)
  const [educationLevel, setEducationLevel] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [fundingBracket, setFundingBracket] = useState('');

  // Verification States
  const [emailStep, setEmailStep] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Documents
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const [scServerFileName, setScServerFileName] = useState('');
  const [scStatus, setScStatus] = useState<CertStatus>('IDLE');
  const [scMessage, setScMessage] = useState('');

  const [incomeServerFileName, setIncomeServerFileName] = useState('');
  const [incomeStatus, setIncomeStatus] = useState<CertStatus>('IDLE');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [extractedIncome, setExtractedIncome] = useState<number | null>(null);

  // App state
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      setError('Please enter a valid email address.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    setEmailError('');
    setOtpError('');
    setEmailStep('sending');
    try {
      const res = await fetch(`${BACKEND}/api/registration/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.message || 'Failed to send OTP';
        setEmailError(errorMsg);
        throw new Error(errorMsg);
      }
      
      setEmailStep('sent');
      setResendCooldown(30);
    } catch (err: any) {
      setEmailStep('idle');
      setError(err.message);
      if (!emailError) {
        setEmailError(err.message);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setOtpError('');
    setEmailStep('verifying');
    try {
      const res = await fetch(`${BACKEND}/api/registration/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      setEmailStep('verified');
      setError('');
    } catch (err: any) {
      setEmailStep('sent');
      setOtpError(err.message);
    }
  };

  const handleVerifyCaste = async (base64: string | null) => {
    if (!base64) return;
    setScStatus('UPLOADING');
    setScMessage('');
    try {
      const formData = new FormData();
      const ext = base64.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
      formData.append('sc_certificate', dataURLtoFile(base64, `sc_cert.${ext}`));
      
      const uploadRes = await fetch(`${BACKEND}/api/registration/upload-docs`, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Document upload failed');
      const uploadData = await uploadRes.json();
      setScServerFileName(uploadData.sc_certificate);
      
      setScStatus('VERIFYING');
      const verifyRes = await fetch(`${BACKEND}/api/registration/verify-caste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sc_certificate: uploadData.sc_certificate, full_name: fullName || 'Applicant', email: email })
      });
      const verifyData = await verifyRes.json();
      
      if (verifyData.success && verifyData.status === 'VERIFIED') {
        setScStatus('VERIFIED');
        setScMessage(verifyData.reason || 'Your caste certificate has been successfully verified.');
      } else {
        setScStatus(verifyData.status || 'FAILED');
        setScMessage(verifyData.reason || 'We could not verify this caste certificate. Please upload a valid Scheduled Caste certificate.');
      }
    } catch (err: any) {
      setScStatus('FAILED');
      setScMessage(err.message || 'An error occurred during verification');
    }
  };

  const handleVerifyIncome = async (base64: string | null) => {
    if (!base64) return;
    setIncomeStatus('UPLOADING');
    setIncomeMessage('');
    setExtractedIncome(null);
    try {
      const formData = new FormData();
      const ext = base64.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
      formData.append('income_certificate', dataURLtoFile(base64, `income_cert.${ext}`));
      
      const uploadRes = await fetch(`${BACKEND}/api/registration/upload-docs`, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Document upload failed');
      const uploadData = await uploadRes.json();
      setIncomeServerFileName(uploadData.income_certificate);
      
      setIncomeStatus('VERIFYING');
      const verifyRes = await fetch(`${BACKEND}/api/registration/verify-income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income_certificate: uploadData.income_certificate, full_name: fullName || 'Applicant', email: email })
      });
      const verifyData = await verifyRes.json();
      
      const inc = verifyData.income ?? null;
      if (inc !== null) {
        setExtractedIncome(inc);
      }

      if (inc !== null && inc > 500000) {
        setIncomeStatus('FAILED');
        setIncomeMessage(`Extracted Annual Family Income from your certificate photo is ₹${Number(inc).toLocaleString('en-IN')}, which exceeds the maximum limit of ₹5,00,000 (₹5 Lakh). Under NSFDC scheme guidelines, applicants with annual income exceeding ₹5 Lakh are not eligible.`);
        return;
      }

      if (verifyData.success && verifyData.status === 'VERIFIED') {
        setIncomeStatus('VERIFIED');
        setIncomeMessage(verifyData.reason || `Income Certificate Verified successfully. Extracted Annual Family Income: ₹${inc ? Number(inc).toLocaleString('en-IN') : 'Verified'} (Eligible: ≤ ₹5,00,000).`);
      } else {
        setIncomeStatus(verifyData.status || 'FAILED');
        setIncomeMessage(verifyData.reason || 'We could not verify this income certificate. Please upload a valid official Income Certificate with annual family income ≤ ₹5,00,000.');
      }
    } catch (err: any) {
      setIncomeStatus('FAILED');
      setIncomeMessage(err.message || 'An error occurred during verification');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSc || !isLowIncome) {
      setError('You must confirm that you belong to a Scheduled Caste and that your family income is below ₹5 lakh to be eligible.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (emailStep !== 'verified') {
      setError('Please verify your email address to continue.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (scStatus !== 'VERIFIED' || incomeStatus !== 'VERIFIED') {
      setError('Please ensure both certificates are verified before continuing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!educationLevel || !tradeCategory || !fundingBracket) {
      setError('Please select your education level, business trade category, and desired funding bracket.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!selfiePhoto) {
      setError('Please provide your live selfie.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload only the selfie, certificates are already uploaded
      setStatusText('Securely finalizing your registration...');
      const formData = new FormData();
      formData.append('selfie', dataURLtoFile(selfiePhoto, 'selfie.jpg'));

      const uploadRes = await fetch(`${BACKEND}/api/registration/upload-docs`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Selfie upload failed');
      const uploadData = await uploadRes.json();

      // Step 2: Create account
      setStatusText('Creating your account...');
      const completeRes = await fetch(`${BACKEND}/api/registration/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          mobile,
          dob: dob || null,
          gender: gender || null,
          email: email || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          city: city || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
          password,
          aadhaar: aadhaar || null,
          selfie_image: uploadData.selfie,
          sc_certificate_file: scServerFileName,
          income_certificate_file: incomeServerFileName,
          eligibility_status: 'verified',
          salary: extractedIncome || null,
          education_level: educationLevel,
          trade_category: tradeCategory,
          funding_bracket: fundingBracket,
          caste_category: 'SC',
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error || 'Registration failed');

      localStorage.setItem('auth_token', completeData.token);
      localStorage.setItem('auth_user', JSON.stringify({
        ...completeData.user,
        education_level: educationLevel,
        trade_category: tradeCategory,
        funding_bracket: fundingBracket,
        caste_category: 'SC',
      }));
      localStorage.setItem('registration_summary', JSON.stringify({
        full_name: fullName,
        mobile,
        salary: completeData.user?.salary || extractedIncome,
        eligibility_status: 'verified',
        education_level: educationLevel,
        trade_category: tradeCategory,
        funding_bracket: fundingBracket,
        overall_confidence: 1, // Deterministic verification
      }));

      router.push('/register/summary');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const pwColor = ['#e2e8f0', '#ef4444', '#f59e0b', '#10b981'][pwStrength];
  const pwLabel = ['', 'Too short', 'Fair', 'Strong'][pwStrength];

  const renderCertStatus = (status: CertStatus, message: string, title: string, onRetry: () => void) => {
    if (status === 'IDLE') return null;

    return (
      <div style={{
        marginTop: 16,
        padding: 20,
        borderRadius: 14,
        border: '1.5px solid',
        borderColor: status === 'VERIFIED' ? '#a7f3d0' : status === 'MANUAL_REVIEW' ? '#fde68a' : status === 'FAILED' ? '#fecaca' : '#e2e8f0',
        background: status === 'VERIFIED' ? '#ecfdf5' : status === 'MANUAL_REVIEW' ? '#fffbeb' : status === 'FAILED' ? '#fef2f2' : '#f8fafc',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {status === 'UPLOADING' && <Loader2 size={24} color="#64748b" style={{ animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: 2 }} />}
          {status === 'VERIFYING' && <RefreshCw size={24} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: 2 }} />}
          {status === 'VERIFIED' && <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />}
          {status === 'MANUAL_REVIEW' && <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />}
          {status === 'FAILED' && <XCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />}
          
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: status === 'VERIFIED' ? '#065f46' : status === 'MANUAL_REVIEW' ? '#92400e' : status === 'FAILED' ? '#991b1b' : '#334155' }}>
              {status === 'UPLOADING' && 'Uploading document...'}
              {status === 'VERIFYING' && `Verifying ${title}...`}
              {status === 'VERIFIED' && `${title} Verified`}
              {status === 'FAILED' && `Verification Failed`}
              {status === 'MANUAL_REVIEW' && `Manual Review Required`}
            </p>

            {(status === 'VERIFIED' || status === 'FAILED' || status === 'MANUAL_REVIEW') && (
              <p style={{ margin: 0, fontSize: 14, color: status === 'VERIFIED' ? '#047857' : status === 'MANUAL_REVIEW' ? '#b45309' : '#b91c1c', lineHeight: 1.5 }}>
                {message}
              </p>
            )}

            {title === 'Family Income Certificate' && extractedIncome !== null && (
              <div
                style={{
                  marginTop: 14,
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: extractedIncome <= 500000 ? '#ffffff' : '#fff5f5',
                  border: `1.5px solid ${extractedIncome <= 500000 ? '#10b981' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                    Extracted Annual Family Income
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: extractedIncome <= 500000 ? '#065f46' : '#991b1b', marginTop: 2 }}>
                    ₹{Number(extractedIncome).toLocaleString('en-IN')} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>/ year</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 800,
                    background: extractedIncome <= 500000 ? '#ecfdf5' : '#fee2e2',
                    color: extractedIncome <= 500000 ? '#059669' : '#dc2626',
                    border: `1px solid ${extractedIncome <= 500000 ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  {extractedIncome <= 500000 ? '✓ Eligible (≤ ₹5,00,000)' : '✕ Not Eligible (> ₹5,00,000)'}
                </div>
              </div>
            )}

            {(status === 'FAILED' || status === 'MANUAL_REVIEW') && (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    padding: '8px 16px',
                    background: '#fff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Upload Another Certificate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isIdentityVerified = !!selfiePhoto;
  const isCertVerified = scStatus === 'VERIFIED' && incomeStatus === 'VERIFIED';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      <NavBar />

      <main style={{ flex: 1, padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              color: '#065f46',
              marginBottom: 12,
            }}>
              <span>🛡️ Official Beneficiary Portal</span>
              <span>•</span>
              <span>Certificate OCR & Live Face Verification</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0b1f3a', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Create Your Beneficiary Account
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 10px' }}>
              Complete the verified application below to establish your profile and access NSFDC concessional loans.
            </p>
            <p style={{ fontSize: 13.5, color: '#475569', margin: 0 }}>
              Already have an account?{' '}
              <a href="/auth" style={{ color: '#0369a1', fontWeight: 700, textDecoration: 'underline' }}>
                Sign In to Citizen Portal →
              </a>
            </p>
          </div>

          {/* ── Official 4-Step Stepper Progress Bar ──────────────────────── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 28,
              boxShadow: '0 2px 6px rgba(0, 30, 64, 0.03)',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(130px, 1fr))', gap: 12, minWidth: 560 }}>
              {[
                { step: '1', title: 'Personal Details', done: !!fullName && !!mobile && emailStep === 'verified' },
                { step: '2', title: 'Security & Access', done: password.length >= 8 && password === confirmPassword },
                { step: '3', title: 'Verification (OCR/Face)', done: isCertVerified && isIdentityVerified },
                { step: '4', title: 'Scheme Goals', done: !!educationLevel && !!tradeCategory && !!fundingBracket },
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: s.done ? '#15803d' : '#001e40',
                      color: '#ffffff',
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.done ? '✓' : s.step}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Step {s.step}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '14px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 28 }}>
              <div>⚠ {error}</div>
              {error.includes('already exists') && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href="/auth"
                    style={{
                      color: '#0369a1',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      fontSize: 13,
                    }}
                  >
                    Click here to Sign In to your existing account →
                  </a>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 20 }}>
              <Loader2 size={52} color="#0b1f3a" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Processing your application</p>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{statusText}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ── SECTION 1: Eligibility & Personal ── */}
              <section style={sectionStyle}>
                <h2 style={sectionHeadingStyle}>1. Eligibility & Personal Details</h2>

                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                    ELIGIBILITY CONFIRMATION (both required)
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={isSc}
                      onChange={e => setIsSc(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#0b1f3a' }}
                    />
                    <span style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                      I belong to a Scheduled Caste (SC) community
                    </span>
                    {isSc && <CheckCircle2 size={18} color="#10b981" />}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isLowIncome}
                      onChange={e => setIsLowIncome(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#0b1f3a' }}
                    />
                    <span style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                      My annual family income is below ₹5,00,000
                    </span>
                    {isLowIncome && <CheckCircle2 size={18} color="#10b981" />}
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} type="text" required placeholder="As it appears on official documents" value={fullName} onChange={e => setFullName(e.target.value)} disabled={scStatus === 'VERIFIED' || incomeStatus === 'VERIFIED'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} type="tel" required maxLength={10} placeholder="10-digit mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email ID <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: emailError ? '#ef4444' : undefined,
                          background: emailStep !== 'idle' ? '#f1f5f9' : '#f8fafc',
                        }}
                        type="email" required placeholder="name@example.com" value={email}
                        onChange={e => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                          if (error && (error.includes('email') || error.includes('already exists'))) setError('');
                          if (emailStep !== 'idle') {
                            setEmailStep('idle');
                            setOtp('');
                            setOtpError('');
                          }
                        }}
                        disabled={emailStep === 'sent' || emailStep === 'verifying' || emailStep === 'verified' || scStatus === 'VERIFIED' || incomeStatus === 'VERIFIED'}
                      />

                      {emailError && (
                        <div style={{ marginTop: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
                          <div>⚠ {emailError}</div>
                          {emailError.includes('already exists') && (
                            <div style={{ marginTop: 6 }}>
                              <a
                                href="/auth"
                                style={{
                                  color: '#0369a1',
                                  textDecoration: 'underline',
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                Sign In to your existing account →
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {emailStep === 'idle' && (
                        <button type="button" onClick={handleSendOtp} style={{ marginTop: 8, padding: '8px 16px', background: '#0b1f3a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          Verify Email
                        </button>
                      )}
                      
                      {emailStep === 'sending' && (
                        <p style={{ marginTop: 8, fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Sending OTP...
                        </p>
                      )}
                      
                      {(emailStep === 'sent' || emailStep === 'verifying' || emailStep === 'verified') && (
                        <div style={{ marginTop: 12, padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
                          {emailStep === 'verified' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600, fontSize: 14 }}>
                              <CheckCircle2 size={18} /> Email verified successfully
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>✓ OTP sent</span>
                                <button type="button" onClick={() => setEmailStep('idle')} style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
                              </div>
                              <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '4px', fontSize: 16, fontWeight: 700 }} />
                              {otpError && <p style={{ fontSize: 12, color: '#ef4444', margin: '8px 0 0' }}>{otpError}</p>}
                              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                 <button type="button" onClick={handleVerifyOtp} disabled={otp.length !== 6 || emailStep === 'verifying'} style={{ flex: 1, padding: '10px', background: otp.length === 6 ? '#0b1f3a' : '#94a3b8', color: 'white', border: 'none', borderRadius: 8, cursor: otp.length === 6 ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                   {emailStep === 'verifying' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : null} Verify OTP
                                 </button>
                                 <button type="button" onClick={handleSendOtp} disabled={resendCooldown > 0} style={{ padding: '10px 16px', background: '#f1f5f9', color: resendCooldown > 0 ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 8, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                                   {resendCooldown > 0 ? `Resend ${resendCooldown}s` : 'Resend'}
                                 </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} type="date" required value={dob} onChange={e => setDob(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                      <select style={inputStyle} required value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Select...</option>
                        <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {emailStep === 'verified' ? (
                <>
                  {/* ── SECTION 2: Address ── */}
                  <section style={sectionStyle}>
                    <h2 style={sectionHeadingStyle}>2. Current Address</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>House/Flat, Building, Street <span style={{ color: '#ef4444' }}>*</span></label>
                        <input style={inputStyle} type="text" required value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Address Line 2 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                        <input style={inputStyle} type="text" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div><label style={labelStyle}>City / Town / Village <span style={{ color: '#ef4444' }}>*</span></label><input style={inputStyle} type="text" required value={city} onChange={e => setCity(e.target.value)} /></div>
                        <div><label style={labelStyle}>District <span style={{ color: '#ef4444' }}>*</span></label><input style={inputStyle} type="text" required value={district} onChange={e => setDistrict(e.target.value)} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>State <span style={{ color: '#ef4444' }}>*</span></label>
                          <select style={inputStyle} required value={state} onChange={e => setState(e.target.value)}>
                            <option value="">Select State</option>
                            {STATES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>PIN Code <span style={{ color: '#ef4444' }}>*</span></label>
                          <input style={inputStyle} type="text" required maxLength={6} placeholder="6 digits" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── SECTION 3: Identity Verification ── */}
                  <section style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 14, marginBottom: 24 }}>
                      <h2 style={{ ...sectionHeadingStyle, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                        3. Live Identity Check
                      </h2>
                      {isIdentityVerified && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                          <CheckCircle2 size={16} /> Live Face Verified
                        </span>
                      )}
                    </div>
                    <CameraCapture
                      title="Live Selfie (for identity verification)"
                      description="Face the camera directly in good lighting. Remove cap, mask, or sunglasses."
                      onPhotoSet={setSelfiePhoto}
                      isDocument={false}
                    />
                  </section>

                  {/* ── SECTION 4: Certificate Verification ── */}
                  <section style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 14, marginBottom: 24 }}>
                      <h2 style={{ ...sectionHeadingStyle, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                        4. Document Verification (Caste & Income OCR)
                      </h2>
                      {scStatus === 'VERIFIED' && incomeStatus === 'VERIFIED' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                          <CheckCircle2 size={16} /> Certificates Verified
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>
                      Please upload images (JPG/PNG) of your certificates containing a government QR code or official seal. 
                      Our system performs instant OCR to verify Scheduled Caste eligibility and confirm annual family income (&le; &#8377;5,00,000).
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                      
                      {/* Caste Certificate */}
                      <div>
                        {scStatus === 'IDLE' ? (
                          <CameraCapture
                            title="SC Caste Certificate"
                            description="Upload or capture a clear photo of your Scheduled Caste certificate. JPG/PNG accepted."
                            onPhotoSet={handleVerifyCaste}
                            isDocument={true}
                          />
                        ) : (
                          renderCertStatus(scStatus, scMessage, 'SC Caste Certificate', () => { setScStatus('IDLE'); setScMessage(''); })
                        )}
                      </div>

                      {/* Income Certificate */}
                      <div>
                        {incomeStatus === 'IDLE' ? (
                          <CameraCapture
                            title="Family Income Certificate"
                            description="Upload or capture a clear photo of your Family Income certificate. JPG/PNG accepted."
                            onPhotoSet={handleVerifyIncome}
                            isDocument={true}
                          />
                        ) : (
                          renderCertStatus(incomeStatus, incomeMessage, 'Family Income Certificate', () => { setIncomeStatus('IDLE'); setIncomeMessage(''); })
                        )}
                      </div>

                      <div style={{ padding: '16px 20px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#f8fafc', marginTop: 12 }}>
                        <label style={labelStyle}>
                          Aadhaar Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — aids faster verification)</span>
                        </label>
                        <input style={inputStyle} type="text" placeholder="XXXX XXXX XXXX" maxLength={14} value={aadhaar} onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setAadhaar(digits.replace(/(.{4})/g, '$1 ').trim());
                        }} />
                      </div>
                    </div>
                  </section>

                  {/* ── SECTION 5: Goals & Educational Profile ── */}
                  <section style={{ ...sectionStyle, opacity: isCertVerified ? 1 : 0.6, pointerEvents: isCertVerified ? 'auto' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 14, marginBottom: 24 }}>
                      <h2 style={{ ...sectionHeadingStyle, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                        5. Goals & Educational Background
                      </h2>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', background: '#f0f9ff', padding: '4px 12px', borderRadius: 20, border: '1px solid #bae6fd' }}>
                        🎯 Pre-Qualifies Schemes
                      </span>
                    </div>

                    {!isCertVerified ? (
                      <div style={{ padding: 24, background: '#f1f5f9', borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#334155' }}>🔒 Locked until certificates are verified.</p>
                        <p style={{ margin: '8px 0 0', fontSize: 14 }}>Please complete the Document Verification step above.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {/* 1. Education Level */}
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 10 }}>
                            Highest Education Level <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {EDUCATION_LEVELS.map(edu => {
                              const isSelected = educationLevel === edu.id;
                              return (
                                <button
                                  key={edu.id}
                                  type="button"
                                  onClick={() => setEducationLevel(edu.id)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                                    background: isSelected ? '#ecfdf5' : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#065f46' : '#0f172a' }}>
                                      {edu.label}
                                    </span>
                                    {isSelected && <CheckCircle2 size={18} color="#059669" />}
                                  </div>
                                  <span style={{ fontSize: 12, color: isSelected ? '#047857' : '#64748b', lineHeight: 1.4 }}>
                                    {edu.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Trade / Venture Category */}
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 10 }}>
                            Planned Business / Trade Category <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {TRADE_CATEGORIES.map(cat => {
                              const isSelected = tradeCategory === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setTradeCategory(cat.id)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                                    background: isSelected ? '#f0f9ff' : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#0369a1' : '#0f172a' }}>
                                        {cat.label}
                                      </span>
                                    </div>
                                    {isSelected && <CheckCircle2 size={18} color="#0284c7" />}
                                  </div>
                                  <span style={{ fontSize: 12, color: isSelected ? '#0284c7' : '#64748b', lineHeight: 1.4 }}>
                                    {cat.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Desired Funding Bracket */}
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 10 }}>
                            Desired Funding Bracket <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {FUNDING_BRACKETS.map(bracket => {
                              const isSelected = fundingBracket === bracket.id;
                              return (
                                <button
                                  key={bracket.id}
                                  type="button"
                                  onClick={() => setFundingBracket(bracket.id)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    border: isSelected ? '2px solid #d97706' : '1.5px solid #e2e8f0',
                                    background: isSelected ? '#fffbeb' : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    boxShadow: isSelected ? '0 4px 12px rgba(217, 119, 6, 0.12)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 18 }}>{bracket.icon}</span>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#92400e' : '#0f172a' }}>
                                        {bracket.label}
                                      </span>
                                    </div>
                                    {isSelected && <CheckCircle2 size={18} color="#d97706" />}
                                  </div>
                                  <span style={{ fontSize: 12, color: isSelected ? '#b45309' : '#64748b', lineHeight: 1.4 }}>
                                    {bracket.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* ── SECTION 6: Security ── */}
                  <section style={{ ...sectionStyle, opacity: isCertVerified ? 1 : 0.6, pointerEvents: isCertVerified ? 'auto' : 'none' }}>
                    <h2 style={sectionHeadingStyle}>6. Set Your Password</h2>

                    {!isCertVerified ? (
                       <div style={{ padding: 24, background: '#f1f5f9', borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#334155' }}>🔒 Locked until certificates are verified.</p>
                          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Please complete the Document Verification step above.</p>
                       </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                          <div style={{ position: 'relative' }}>
                            <input style={{ ...inputStyle, paddingRight: 44 }} type={showPw ? 'text' : 'password'} required placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {password.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(pwStrength / 3) * 100}%`, background: pwColor, transition: 'all 0.3s' }} />
                              </div>
                              <span style={{ fontSize: 12, color: pwColor, fontWeight: 600 }}>{pwLabel}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={labelStyle}>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                          <input style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : '#e2e8f0' }} type={showPw ? 'text' : 'password'} required placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                          {confirmPassword && confirmPassword !== password && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>Passwords do not match</p>}
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8, cursor: 'pointer', background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                          <input type="checkbox" required checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#0b1f3a', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                            I declare that all information and documents are true and correct. I consent to PradarshakAI processing this data to determine my eligibility for NSFDC concessional finance schemes.
                          </span>
                        </label>

                        <button
                          type="submit"
                          disabled={!acceptedTerms}
                          style={{
                            width: '100%', marginTop: 8, padding: '17px', borderRadius: 14,
                            background: acceptedTerms ? '#0b1f3a' : '#94a3b8', color: '#fff', fontSize: 15, fontWeight: 800,
                            border: 'none', cursor: acceptedTerms ? 'pointer' : 'not-allowed',
                            boxShadow: acceptedTerms ? '0 4px 16px rgba(11, 31, 58, 0.2)' : 'none', transition: 'all 0.2s', letterSpacing: '0.01em',
                          }}
                        >
                          Submit Application & Create Account
                        </button>

                        <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b', margin: 0 }}>
                          Already registered? <a href="/auth" style={{ color: '#0b1f3a', fontWeight: 700, textDecoration: 'none' }}>Sign in here</a>
                        </p>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <div style={{ padding: '32px 24px', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 24, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                     <CheckCircle2 size={24} />
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>Complete Section 1 First</p>
                  <p style={{ margin: 0, fontSize: 14, maxWidth: 300 }}>Please verify your email address to continue to the remaining registration steps.</p>
                </div>
              )}

            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
