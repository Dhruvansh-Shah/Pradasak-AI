'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import EmblemOfIndia from '@/components/EmblemOfIndia';
import { getSharedChat, ChatMessage } from '@/lib/api';
import { renderText } from '@/lib/textFormat';
import {
  MessageSquare,
  Share2,
  Calendar,
  AlertCircle,
  ArrowRight,
  User,
  ShieldCheck,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import SchemeResultCard from '@/components/SchemeResultCard';
import EMIResultCard from '@/components/EMIResultCard';
import ComparisonCard from '@/components/ComparisonCard';
import DocumentCard from '@/components/DocumentCard';
import PartnerResultCard from '@/components/PartnerResultCard';

interface SharedChatPageProps {
  params: Promise<{ id: string }>;
}

export default function SharedChatPage({ params }: SharedChatPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const shareId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMeta, setChatMeta] = useState<{ title: string; created_at: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!shareId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getSharedChat(shareId)
      .then((data) => {
        if (!isMounted) return;
        setChatMeta(data.chat);
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Shared conversation not found or access has expired.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <NavBar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 64px' }}>
        <div style={{ width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Read-only Notice Banner */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Share2 size={16} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>
                  Shared Advisory Consultation
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#3b82f6', marginTop: 1 }}>
                  This is a read-only shared transcript. You can start your own consultation anytime.
                </p>
              </div>
            </div>

            <Link
              href="/chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: '#0b1f3a',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)',
              }}
            >
              <span>Start Your Consultation</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Loading shared conversation…
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '48px 24px',
                textAlign: 'center',
                border: '1.5px solid #fee2e2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <AlertCircle size={26} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#991b1b' }}>
                  Conversation Not Found
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', maxWidth: 420 }}>
                  {error}
                </p>
              </div>
              <Link
                href="/chat"
                style={{
                  marginTop: 6,
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: '#0b1f3a',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Go to Scheme Advisory
              </Link>
            </div>
          )}

          {/* Shared Content */}
          {!loading && !error && chatMeta && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                boxShadow: '0 4px 20px rgba(11, 31, 58, 0.05)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#fbbf24',
                      marginBottom: 6,
                    }}
                  >
                    Official Scheme Consultation
                  </span>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    {chatMeta.title}
                  </h1>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#cbd5e1',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '6px 12px',
                    borderRadius: 8,
                  }}
                >
                  <Calendar size={13} color="#94a3b8" />
                  <span>
                    {new Date(chatMeta.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Messages Stream */}
              <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 32 }}>
                    No messages recorded in this conversation.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const schemes = msg.type === 'schemes' ? (((msg.data as any)?.schemes as any[]) || []) : [];
                    const emiData = msg.type === 'emi' ? (msg.data as any) : null;
                    const partners = (msg.type === 'partners' || msg.type === 'partner') ? (((msg.data as any)?.partners as any[]) || []) : [];
                    const comparison = msg.type === 'comparison' ? (msg.data as any) : null;
                    const documents = msg.type === 'documents' ? (((msg.data as any)?.documents as string[]) || []) : [];

                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          flexDirection: isUser ? 'row-reverse' : 'row',
                          width: '100%',
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: isUser ? '#001e40' : '#ffffff',
                            border: isUser ? '1px solid #001e40' : '1.5px solid #cbd5e1',
                            color: isUser ? '#ffffff' : '#001e40',
                            padding: isUser ? 0 : 3,
                          }}
                        >
                          {isUser ? <User size={16} /> : <EmblemOfIndia size={24} />}
                        </div>

                        {/* Content column */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '88%',
                            width: '100%',
                            gap: 12,
                          }}
                        >
                          {/* Bubble */}
                          <div
                            style={{
                              width: isUser ? 'auto' : '100%',
                              maxWidth: '100%',
                              padding: '14px 18px',
                              borderRadius: 16,
                              borderTopRightRadius: isUser ? 4 : 16,
                              borderTopLeftRadius: isUser ? 16 : 4,
                              fontSize: 14,
                              lineHeight: 1.6,
                              background: isUser ? '#001e40' : '#ffffff',
                              color: isUser ? '#ffffff' : '#0f172a',
                              border: isUser ? 'none' : '1px solid #e2e8f0',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {msg.content.split('\n').map((line, i) => (
                                <p
                                  key={i}
                                  style={{
                                    margin: i > 0 ? '6px 0 0' : 0,
                                    color: isUser ? '#ffffff' : '#0f172a',
                                  }}
                                >
                                  {renderText(line)}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Structured Schemes Cards */}
                          {!isUser && schemes.length > 0 && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {schemes.map((s: any, i: number) => (
                                <SchemeResultCard
                                  key={s.id || i}
                                  scheme={s}
                                  rank={i + 1}
                                  onKnowMore={() => router.push('/chat')}
                                  onGetDocuments={() => router.push('/chat')}
                                  onCalculateEMI={(scheme) => router.push(scheme.id ? `/emi?schemeId=${scheme.id}` : '/emi')}
                                />
                              ))}
                            </div>
                          )}

                          {/* Structured EMI Card */}
                          {!isUser && emiData && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <EMIResultCard data={emiData} />
                              <Link
                                href={emiData.schemeId || emiData.scheme?.id ? `/emi?schemeId=${emiData.schemeId || emiData.scheme?.id}` : '/emi'}
                                style={{
                                  alignSelf: 'flex-start',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 14px',
                                  borderRadius: 8,
                                  background: '#fff7ed',
                                  border: '1.5px solid #ea580c',
                                  color: '#9a3412',
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                <Calculator size={14} />
                                <span>Open Interactive EMI Calculator</span>
                              </Link>
                            </div>
                          )}

                          {/* Structured Partners Cards */}
                          {!isUser && partners.length > 0 && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {partners.map((p: any, i: number) => (
                                <PartnerResultCard
                                  key={i}
                                  partner={p}
                                  rank={i + 1}
                                />
                              ))}
                            </div>
                          )}

                          {/* Structured Comparison Card */}
                          {!isUser && comparison && (() => {
                            const schemesList = (comparison.schemes as any[]) || [comparison.schemeA, comparison.schemeB].filter(Boolean);
                            return (
                              <div style={{ width: '100%' }}>
                                <ComparisonCard
                                  schemes={schemesList}
                                  schemeA={comparison.schemeA}
                                  schemeB={comparison.schemeB}
                                  onCalculateEMI={(s) => router.push(s.id ? `/emi?schemeId=${s.id}` : '/emi')}
                                  onKnowMore={() => router.push('/chat')}
                                />
                              </div>
                            );
                          })()}

                          {/* Structured Documents Card */}
                          {!isUser && documents.length > 0 && (
                            <div style={{ width: '100%' }}>
                              <DocumentCard
                                documents={documents}
                                schemeName={((msg.data as any)?.schemeName || (msg.data as any)?.scheme_name || (msg.data as any)?.scheme?.name) as string | undefined}
                                note={(msg.data as any)?.note as string | undefined}
                              />
                            </div>
                          )}

                          {/* Disclaimer */}
                          {!isUser && msg.disclaimer && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 12,
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                color: '#9a3412',
                                padding: '10px 14px',
                                borderRadius: 10,
                                width: '100%',
                              }}
                            >
                              <ShieldCheck size={16} color="#c2410c" style={{ flexShrink: 0 }} />
                              <span>{msg.disclaimer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Read-only Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  PradarshakAI • Ministry of Social Justice and Empowerment
                </span>

                <Link
                  href="/chat"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0b1f3a',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Launch your own advisory session</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
