'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import EmblemOfIndia from '@/components/EmblemOfIndia';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Landmark,
  Briefcase,
  GraduationCap,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Edit3,
  X,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';

const STATES_LIST = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry', 'Jammu & Kashmir',
  'Ladakh', 'Chandigarh', 'Dadra & Nagar Haveli', 'Andaman & Nicobar Islands', 'Lakshadweep',
];

const EDUCATION_OPTIONS: Record<string, string> = {
  school: 'Schooling / Matriculate (10th / 12th)',
  diploma: 'Vocational Diploma / ITI / Polytechnic',
  undergraduate: 'Graduate / Bachelor’s Degree',
  postgraduate: 'Postgraduate / Professional Degree',
};

const TRADE_OPTIONS: Record<string, { label: string; icon: string }> = {
  retail_shop: { label: 'Retail & Kirana Store', icon: '🏪' },
  tailoring_garments: { label: 'Tailoring & Garments', icon: '🧵' },
  agriculture_allied: { label: 'Dairy & Agri Allied', icon: '🐄' },
  transport_logistics: { label: 'Transport & Logistics', icon: '🚚' },
  it_technical_services: { label: 'IT & Tech Services', icon: '💻' },
  artisans_handicrafts: { label: 'Artisans & Handicrafts', icon: '🎨' },
  education_training: { label: 'Education & Training', icon: '🎓' },
  sanitation_green_business: { label: 'Sanitation & Green Business', icon: '♻️' },
};

const FUNDING_OPTIONS: Record<string, string> = {
  MICRO_UNDER_1_4L: 'Micro Finance (≤ ₹1.40 Lakh)',
  SMALL_1_4_TO_15L: 'Small Business (₹1.40L – ₹15 Lakh)',
  MEDIUM_15_TO_50L: 'Term Loan Enterprise (₹15L – ₹50 Lakh)',
  EDUCATION_VOCATIONAL: 'Education Loan (Up to ₹20L / ₹30L)',
};

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'CZ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return '₹' + num.toLocaleString('en-IN');
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchUser = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(authToken);
      if (data.guest) {
        setProfile(null);
      } else {
        setProfile(data);
        // Sync to localStorage
        localStorage.setItem('auth_user', JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('[Profile Fetch Error]', err);
      setError(t('profile.error_loading', 'Unable to load your profile right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      setToken(storedToken);
      if (storedToken) {
        fetchUser(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, [fetchUser]);

  // Profile completion score calculator
  const completionPercent = useMemo(() => {
    if (!profile) return 0;
    const tracked = [
      profile.name,
      profile.email,
      profile.phone,
      profile.dob,
      profile.gender,
      profile.city,
      profile.state,
      profile.pincode,
      profile.salary,
      profile.caste_category,
      profile.education_level || profile.trade_category,
    ];
    const filled = tracked.filter(Boolean).length;
    return Math.min(100, Math.round((filled / tracked.length) * 100));
  }, [profile]);

  const openEditModal = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || '',
      phone: profile.phone || '',
      dob: profile.dob ? profile.dob.split('T')[0] : '',
      gender: profile.gender || '',
      address_line1: profile.address_line1 || '',
      address_line2: profile.address_line2 || '',
      city: profile.city || '',
      district: profile.district || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
      education_level: profile.education_level || '',
      trade_category: profile.trade_category || '',
      funding_bracket: profile.funding_bracket || '',
      salary: profile.salary || '',
    });
    setEditError(null);
    setSaveSuccess(false);
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setEditError(null);

    try {
      const res = await updateUserProfile(token, editForm);
      if (res.user) {
        setProfile(res.user);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditOpen(false);
          setSaveSuccess(false);
        }, 800);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes. Please verify input fields.');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = profile?.eligibility_status === 'verified' || profile?.mobile_verified;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background, #fbf9f8)' }}>
      <NavBar />

      <main style={{ flex: 1, padding: '28px 16px 64px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── TOP INSTITUTIONAL ACCREDITATION STRIP ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <EmblemOfIndia size={26} />
              <div>
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#001e40', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('profile.nsfdc_header', 'National Scheduled Castes Finance and Development Corporation')}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                  {t('profile.subtitle', 'Official Beneficiary Record • Ministry of Social Justice & Empowerment')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#15803d" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803d' }}>
                NSFDC Direct Portal
              </span>
            </div>
          </div>

          {/* ── LOADING SKELETON STATE ── */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Hero Skeleton */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  border: '1.5px solid #e2e8f0',
                  padding: '32px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: '40%', height: 24, background: '#e2e8f0', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '60%', height: 16, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '25%', height: 16, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>

              {/* Grid Cards Skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: '#ffffff',
                      borderRadius: 16,
                      border: '1px solid #e2e8f0',
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <div style={{ width: '50%', height: 18, background: '#e2e8f0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '100%', height: 14, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '80%', height: 14, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '90%', height: 14, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {!loading && error && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 18,
                border: '1.5px solid #fee2e2',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.06)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                  {error}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Please verify your network connection or session token.
                </p>
              </div>
              <button
                type="button"
                onClick={() => token && fetchUser(token)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: '#001e40',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} />
                <span>{t('profile.retry', 'Retry')}</span>
              </button>
            </div>
          )}

          {/* ── UNAUTHENTICATED GUEST STATE ── */}
          {!loading && !error && !profile && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                border: '1.5px solid #e2e8f0',
                padding: '56px 28px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                boxShadow: '0 6px 24px rgba(0, 30, 64, 0.05)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: '#e6eef8',
                  color: '#003366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={30} />
              </div>
              <div style={{ maxWidth: 520 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#001e40', margin: '0 0 8px' }}>
                  {t('profile.unauth_title', 'Citizen Sign-In Required')}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {t('profile.unauth_desc', 'Please sign in with your registered mobile or email to view your official profile, verified eligibility status, and personalized loan recommendations.')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                <Link
                  href="/auth?returnUrl=/profile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 22px',
                    borderRadius: 10,
                    background: '#003366',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0, 51, 102, 0.25)',
                  }}
                >
                  <User size={15} />
                  <span>{t('profile.signin_btn', 'Sign In to Account')}</span>
                </Link>

                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 22px',
                    borderRadius: 10,
                    background: '#ffffff',
                    color: '#001e40',
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>{t('profile.register_btn', 'Register New Citizen')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* ── AUTHENTICATED PROFILE VIEW ── */}
          {!loading && !error && profile && (
            <>
              {/* ── PROFILE HERO SUMMARY CARD ── */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 20,
                  border: '1.5px solid #e2e8f0',
                  padding: '28px 30px',
                  boxShadow: '0 4px 20px rgba(0, 30, 64, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  {/* Deterministic Initials Avatar */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #001e40 0%, #003366 100%)',
                      border: '3px solid #fe9832',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 14px rgba(0, 30, 64, 0.22)',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(profile.name)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#001e40', margin: 0, lineHeight: 1.2 }}>
                        {profile.name || 'Registered Citizen'}
                      </h1>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: isVerified ? '#ecfdf5' : '#fffbeb',
                          color: isVerified ? '#047857' : '#b45309',
                          border: isVerified ? '1px solid #a7f3d0' : '1px solid #fde68a',
                        }}
                      >
                        {isVerified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                        {isVerified
                          ? t('profile.verified_badge', 'Verified Beneficiary')
                          : t('profile.pending_badge', 'Pending Verification')}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      {t('profile.summary_line', 'Your verified citizen record on PradarshakAI')}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: '#003366',
                          background: '#eff6ff',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 700,
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <span>{t('profile.beneficiary_id', 'Beneficiary ID')}:</span>
                        <strong style={{ fontFamily: 'monospace', fontSize: 12.5 }}>
                          BEN-{String(profile.id).padStart(6, '0')}
                        </strong>
                      </span>

                      {profile.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#334155' }}>
                          <Mail size={13} color="#64748b" />
                          <span>{profile.email}</span>
                        </span>
                      )}

                      {profile.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#334155' }}>
                          <Phone size={13} color="#64748b" />
                          <span>+91 {profile.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action & Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 160 }}>
                  <button
                    type="button"
                    onClick={openEditModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 18px',
                      borderRadius: 10,
                      background: '#003366',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.2)',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#001e40')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#003366')}
                  >
                    <Edit3 size={14} />
                    <span>{t('profile.edit_btn', 'Edit Profile')}</span>
                  </button>

                  <div style={{ width: '100%', maxWidth: 170 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      <span>{t('profile.completion_rate', 'Profile Completion')}</span>
                      <span style={{ color: '#003366' }}>{completionPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${completionPercent}%`,
                          height: '100%',
                          borderRadius: 3,
                          background: 'linear-gradient(90deg, #fe9832, #15803d)',
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2x2 MAIN DASHBOARD GRID ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

                {/* 1. PERSONAL INFORMATION CARD */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1.5px solid #f1f5f9' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#001e40', margin: 0 }}>
                        {t('profile.sec_personal', 'Personal Information')}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_fullname', 'Full Name')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.name || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_dob', 'Date of Birth')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.dob ? formatDate(profile.dob) : t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_gender', 'Gender')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.gender || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_phone', 'Mobile Number')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>+91 {profile.phone}</span>
                        {profile.mobile_verified && (
                          <span title="Verified" style={{ color: '#15803d', display: 'inline-flex' }}><CheckCircle2 size={13} /></span>
                        )}
                      </p>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_email', 'Email Address')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{profile.email}</span>
                        {profile.email_verified && (
                          <span title="Verified" style={{ color: '#15803d', display: 'inline-flex' }}><CheckCircle2 size={13} /></span>
                        )}
                      </p>
                    </div>

                    {profile.aadhaar && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {t('profile.lbl_aadhaar', 'Aadhaar (Last 4 Digits)')}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                          •••• •••• {profile.aadhaar.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. ADDRESS & LOCATION CARD */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1.5px solid #f1f5f9' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#001e40', margin: 0 }}>
                        {t('profile.sec_address', 'Address & Location')}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {(profile.address_line1 || profile.address_line2) && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {t('profile.lbl_address1', 'Residential Address')}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                          {[profile.address_line1, profile.address_line2].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_city', 'City / Town')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.city || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_district', 'District')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.district || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_state', 'State / UT')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.state || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_pincode', 'PIN Code')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                        {profile.pincode || t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. SOCIO-ECONOMIC & SCHEME PRE-QUALIFICATION CARD */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1.5px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Coins size={18} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#001e40', margin: 0 }}>
                          {t('profile.sec_socio', 'Socio-Economic & Scheme Profiling')}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_caste', 'Category')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#003366' }}>
                        {profile.caste_category ? `${profile.caste_category} (Scheduled Caste)` : 'SC (Target Beneficiary)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_income', 'Annual Family Income')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {profile.salary ? `${formatCurrency(profile.salary)} / year` : '≤ ₹3,00,000 / year'}
                      </p>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_education', 'Education Level')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.education_level ? (EDUCATION_OPTIONS[profile.education_level] || profile.education_level) : t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_trade', 'Trade / Occupation')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {profile.trade_category
                          ? `${TRADE_OPTIONS[profile.trade_category]?.icon || '💼'} ${TRADE_OPTIONS[profile.trade_category]?.label || profile.trade_category}`
                          : t('profile.not_provided', 'Not provided')}
                      </p>
                    </div>

                    {profile.funding_bracket && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {t('profile.lbl_funding', 'Funding Bracket')}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                          {FUNDING_OPTIONS[profile.funding_bracket] || profile.funding_bracket}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/chat"
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: '#fff7ed',
                      border: '1.5px solid #fe9832',
                      color: '#9a3412',
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <Sparkles size={15} color="#ea580c" />
                    <span>{t('profile.find_schemes', 'Explore Matching Schemes')}</span>
                    <ArrowRight size={14} color="#ea580c" />
                  </Link>
                </div>

                {/* 4. ACCOUNT & AUDIT CARD */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1.5px solid #f1f5f9' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Landmark size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#001e40', margin: 0 }}>
                        {t('profile.sec_account', 'Account & Verification Details')}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_created_at', 'Registration Date')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                        {formatDate(profile.created_at)}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_updated_at', 'Last Updated')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                        {profile.updated_at ? formatDate(profile.updated_at) : formatDate(profile.created_at)}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_mobile_status', 'Mobile Status')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: profile.mobile_verified ? '#15803d' : '#b45309' }}>
                        {profile.mobile_verified ? t('profile.verified', 'Verified') : t('profile.not_verified', 'Pending Verification')}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_email_status', 'Email Status')}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: profile.email_verified ? '#15803d' : '#64748b' }}>
                        {profile.email_verified ? t('profile.verified', 'Verified') : 'Standard'}
                      </p>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {t('profile.lbl_eligibility', 'Eligibility Status')}
                      </span>
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isVerified ? '#ecfdf5' : '#fffbeb',
                            color: isVerified ? '#047857' : '#b45309',
                            border: isVerified ? '1px solid #a7f3d0' : '1px solid #fde68a',
                          }}
                        >
                          {profile.eligibility_status || (isVerified ? 'verified' : 'pending_manual_review')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── EDIT PROFILE MODAL ── */}
          {isEditOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0, 30, 64, 0.6)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
              onClick={() => setIsEditOpen(false)}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #cbd5e1',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#001e40',
                    color: '#ffffff',
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Edit3 size={18} color="#fe9832" />
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                      {t('profile.edit_btn', 'Edit Profile Details')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSaveProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {editError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                      {editError}
                    </div>
                  )}

                  {saveSuccess && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} />
                      <span>{t('profile.success_saved', 'Profile updated successfully.')}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_fullname', 'Full Name')}
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_phone', 'Mobile Number')}
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_dob', 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        value={editForm.dob || ''}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_gender', 'Gender')}
                      </label>
                      <select
                        value={editForm.gender || ''}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_address1', 'Address Line 1')}
                      </label>
                      <input
                        type="text"
                        value={editForm.address_line1 || ''}
                        onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_address2', 'Address Line 2')}
                      </label>
                      <input
                        type="text"
                        value={editForm.address_line2 || ''}
                        onChange={(e) => setEditForm({ ...editForm, address_line2: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_city', 'City / Village')}
                      </label>
                      <input
                        type="text"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_district', 'District')}
                      </label>
                      <input
                        type="text"
                        value={editForm.district || ''}
                        onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_state', 'State')}
                      </label>
                      <select
                        value={editForm.state || ''}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                      >
                        <option value="">Select State</option>
                        {STATES_LIST.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_pincode', 'PIN Code')}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editForm.pincode || ''}
                        onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_income', 'Annual Family Income (₹)')}
                      </label>
                      <input
                        type="number"
                        value={editForm.salary || ''}
                        onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_education', 'Education Level')}
                      </label>
                      <select
                        value={editForm.education_level || ''}
                        onChange={(e) => setEditForm({ ...editForm, education_level: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                      >
                        <option value="">Select Education Level</option>
                        {Object.entries(EDUCATION_OPTIONS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {t('profile.lbl_trade', 'Trade / Occupation')}
                      </label>
                      <select
                        value={editForm.trade_category || ''}
                        onChange={(e) => setEditForm({ ...editForm, trade_category: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                      >
                        <option value="">Select Trade / Occupation</option>
                        {Object.entries(TRADE_OPTIONS).map(([k, v]) => (
                          <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 8,
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: 13,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {t('profile.cancel_btn', 'Cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        background: '#003366',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 700,
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving && <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                      <span>{saving ? t('profile.saving', 'Saving…') : t('profile.save_btn', 'Save Changes')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
