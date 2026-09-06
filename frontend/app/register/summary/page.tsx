'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function SummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const summaryStr = localStorage.getItem('registration_summary');
    if (summaryStr) {
      setData(JSON.parse(summaryStr));
      localStorage.removeItem('registration_summary');
    } else {
      router.replace('/');
    }
  }, [router]);

  if (!data) return null;

  const isVerified = data.eligibility_status === 'verified';
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      <NavBar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 700, width: '100%', background: '#fff', padding: 48, borderRadius: 24, boxShadow: '0 12px 36px rgba(11, 31, 58, 0.08)', border: '1px solid #e2e8f0' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        {isVerified ? (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={48} color="#10b981" />
          </div>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <AlertCircle size={48} color="#f59e0b" />
          </div>
        )}
        
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0b1f3a', marginBottom: 12 }}>
          {isVerified ? 'Verification Successful!' : 'Application Submitted'}
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
          {isVerified 
            ? 'Our automated AI engine has successfully verified your documents. You are now fully eligible to apply for all NSFDC schemes.'
            : 'Your application has been received and is pending manual verification by our officers. This usually takes 2-3 business days.'}
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color="#0b1f3a" /> Registration Details
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Applicant Name</div>
            <div style={{ fontSize: 15, color: '#0f172a', fontWeight: 600 }}>{data.full_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Mobile</div>
            <div style={{ fontSize: 15, color: '#0f172a', fontWeight: 600 }}>+91 {data.mobile}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Account Status</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isVerified ? '#ecfdf5' : '#fffbeb', color: isVerified ? '#059669' : '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {isVerified ? 'Active & Verified' : 'Pending Review'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Verified Annual Salary / Income</div>
            <div style={{ fontSize: 15, color: '#0f172a', fontWeight: 700 }}>
              {data.salary ? `₹${Number(data.salary).toLocaleString('en-IN')}` : '≤ ₹5,00,000'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button 
          onClick={() => router.push('/schemes')}
          style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#0b1f3a', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(11, 31, 58, 0.15)' }}
        >
          Explore Concessional Schemes <ArrowRight size={18} />
        </button>
        
        <button 
          onClick={() => router.push('/')}
          style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#fff', color: '#0b1f3a', fontSize: 15, fontWeight: 700, border: '1.5px solid #0b1f3a', cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
      </div>
      </div>
    </main>

    <Footer />
    </div>
  );
}
