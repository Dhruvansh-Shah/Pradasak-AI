'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '@/lib/api';
import type { ChatResponse, ChatMessage } from '@/lib/api';
import TypingIndicator from './TypingIndicator';
import TypewriterText from './TypewriterText';
import SchemeResultCard from './SchemeResultCard';
import EMIResultCard from './EMIResultCard';
import PartnerResultCard from './PartnerResultCard';
import ComparisonCard from './ComparisonCard';
import DocumentCard from './DocumentCard';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Info,
  Briefcase,
  GraduationCap,
  Calculator,
  HeartHandshake,
  ArrowRight,
  Globe,
  CornerDownLeft
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { renderText } from '@/lib/textFormat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  type?: ChatResponse['type'];
  data?: Record<string, unknown>;
  quickActions?: ChatResponse['quickActions'];
  disclaimer?: string;
  /** True only for freshly-received assistant replies — drives the typing
   *  animation. Messages loaded from chat history render instantly. */
  animate?: boolean;
}

type Language = 'en' | 'hi' | 'mr';

const LANG_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};

const SUGGESTIONS: Record<
  Language,
  { title: string; desc: string; query: string; icon: React.ElementType; tag: string; color: string; bg: string }[]
> = {
  en: [
    {
      title: 'Small Business & Trade Loan',
      desc: 'Concessional loans up to ₹50 Lakh for tailoring units, kirana shops, or service ventures with family income ≤ ₹5L.',
      query: 'I want to start a small tailoring shop. Family income is about ₹2.5 Lakh a year. What scheme can I get?',
      icon: Briefcase,
      tag: 'Term Loan / Micro',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      title: 'Higher & Technical Education Loan',
      desc: 'Subsidized 4%–6% interest loans covering tuition, hostel, and equipment for engineering, medical, or professional degrees.',
      query: 'I need an education loan for an engineering degree. How much loan can I get and at what interest rate?',
      icon: GraduationCap,
      tag: 'Education Loan',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      title: 'Mahila Samriddhi Yojana',
      desc: 'Exclusive micro-credit up to ₹1.40 Lakh at concessional 4% interest designed specifically for SC women entrepreneurs.',
      query: 'Tell me about Mahila Samriddhi Yojana and schemes exclusively for SC women.',
      icon: HeartHandshake,
      tag: 'Women Exclusive',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      title: 'Calculate Monthly EMI & Moratorium',
      desc: 'Deterministic monthly repayment projections accounting for scheme-specific interest rates and 3–12 month grace periods.',
      query: 'Calculate monthly EMI for ₹5 Lakh loan at 7% interest for 5 years with a 6-month moratorium.',
      icon: Calculator,
      tag: 'Financial Math',
      color: '#15803d',
      bg: '#f0fdf4',
    },
  ],
  hi: [
    {
      title: 'छोटा व्यवसाय / दुकान ऋण',
      desc: 'सिलाई, किराना या व्यापार इकाई के लिए ₹1.40L से ₹50L तक रियायती सरकारी ऋण (पारिवारिक आय ≤ ₹5 लाख)।',
      query: 'मुझे सिलाई और कपड़ों की दुकान खोलनी है। परिवार की सालाना आय ₹2.5 लाख है। मुझे कौन सी योजना मिलेगी?',
      icon: Briefcase,
      tag: 'व्यवसाय ऋण',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      title: 'उच्च एवं तकनीकी शिक्षा ऋण',
      desc: 'इंजीनियरिंग, मेडिकल व वोकेशनल पढ़ाई के लिए 4%–6% की बेहद कम ब्याज दर पर शिक्षा ऋण सहायता।',
      query: 'मुझे बीटेक/इंजीनियरिंग के लिए एजुकेशन लोन चाहिए। ब्याज दर और अधिकतम सीमा क्या है?',
      icon: GraduationCap,
      tag: 'शिक्षा ऋण',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      title: 'महिला समृद्धि योजना',
      desc: 'अनुसूचित जाति की महिला उद्यमियों व स्वयं सहायता समूहों के लिए 4% ब्याज पर ₹1.40 लाख तक विशेष सहायता।',
      query: 'अनुसूचित जाति की महिलाओं के लिए महिला समृद्धि योजना के बारे में विस्तार से बताएं।',
      icon: HeartHandshake,
      tag: 'महिला विशेष',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      title: 'मासिक EMI एवं मोरेटोरियम गणना',
      desc: 'ब्याज दर और 3 से 12 महीने की ग्रेस अवधि (मोरेटोरियम) के साथ सटीक मासिक किस्त की गणना करें।',
      query: '₹5 लाख के कर्ज पर 7% ब्याज और 5 साल की अवधि के लिए मासिक EMI क्या बनेगी?',
      icon: Calculator,
      tag: 'EMI कैलकुलेटर',
      color: '#15803d',
      bg: '#f0fdf4',
    },
  ],
  mr: [
    {
      title: 'लहान व्यवसाय व दुकान कर्ज',
      desc: 'शिवणकाम, किराणा दुकान किंवा व्यवसायासाठी सवलतीच्या दरात ₹५० लाखांपर्यंत कर्ज सहाय्य.',
      query: 'मला शिवणकाम व कपड्यांचे दुकान सुरू करायचे आहे. कौटुंबिक उत्पन्न ₹२.५ लाख आहे. कोणती योजना मिळेल?',
      icon: Briefcase,
      tag: 'व्यवसाय कर्ज',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      title: 'उच्च शिक्षण कर्ज योजना',
      desc: 'अभियांत्रिकी व वैद्यकीय शिक्षणासाठी ४%–६% सवलतीच्या व्याजदरात शैक्षणिक कर्ज.',
      query: 'अभियांत्रिकी शिक्षणासाठी मला कर्ज हवे आहे. कमाल मर्यादा आणि व्याज दर काय आहे?',
      icon: GraduationCap,
      tag: 'शिक्षण कर्ज',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      title: 'महिला समृद्धी योजना',
      desc: 'अनुसूचित जातीच्या महिला उद्योजकांसाठी ४% व्याजदरावर ₹१.४० लाखांपर्यंत विशेष कर्ज.',
      query: 'अनुसूचित जातीच्या महिलांसाठी उपलब्ध असलेल्या विशेष योजनांची माहिती द्या.',
      icon: HeartHandshake,
      tag: 'महिला विशेष',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      title: 'मासिक हप्ता (EMI) गणना',
      desc: 'सवलत कालावधीसह अचूक मासिक हप्त्याची आणि व्याजाची गणितीय गणना करा.',
      query: '५ लाख रुपयांवर ७% दराने ५ वर्षांसाठी मासिक हप्ता किती येईल?',
      icon: Calculator,
      tag: 'EMI गणना',
      color: '#15803d',
      bg: '#f0fdf4',
    },
  ],
};

function MessageBubble({
  msg,
  onAction,
  scrollRef,
}: {
  msg: Message;
  onAction: (text: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const isUser = msg.role === 'user';
  const [textDone, setTextDone] = useState(!msg.animate);
  const showExtras = !msg.animate || textDone;

  const schemes = msg.type === 'schemes' ? (msg.data?.schemes as unknown[]) || [] : [];
  const emiData = msg.type === 'emi' ? msg.data : null;
  const partners = msg.type === 'partners' ? (msg.data?.partners as unknown[]) || [] : [];
  const comparison = msg.type === 'comparison' ? msg.data : null;
  const documents = msg.type === 'documents' ? (msg.data?.documents as string[]) || [] : [];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 24,
        width: '100%',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Role Avatar */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? '#0b1f3a' : 'linear-gradient(135deg, #e87722, #d36513)',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Bubble + Cards Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          width: '100%',
          gap: 12,
        }}
      >
        {/* Main Text Content */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 18,
            borderTopRightRadius: isUser ? 4 : 18,
            borderTopLeftRadius: isUser ? 18 : 4,
            fontSize: 14.5,
            lineHeight: 1.65,
            background: isUser ? '#0b1f3a' : '#ffffff',
            color: isUser ? '#ffffff' : '#1e293b',
            border: isUser ? 'none' : '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {isUser ? (
              msg.text.split('\n').map((line, i) => (
                <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, color: '#ffffff' }}>
                  {renderText(line)}
                </p>
              ))
            ) : (
              <TypewriterText
                text={msg.text}
                animate={!!msg.animate}
                color="#1e293b"
                onTick={() => scrollRef?.current?.scrollIntoView({ behavior: 'auto', block: 'end' })}
                onDone={() => setTextDone(true)}
              />
            )}
          </div>
        </div>

        {/* Structured Data Result Cards — held back until the reply finishes typing */}
        {showExtras && schemes.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schemes.map((s, i) => (
              <SchemeResultCard
                key={i}
                scheme={s as Parameters<typeof SchemeResultCard>[0]['scheme']}
                rank={i + 1}
                onCalculateEMI={() =>
                  onAction(`Calculate EMI for the ${(s as { name: string }).name} scheme`)
                }
                onFindPartners={() => onAction('Find nearest partner for applying')}
              />
            ))}
          </div>
        )}

        {showExtras && emiData && (
          <div style={{ width: '100%' }}>
            <EMIResultCard
              data={emiData as unknown as Parameters<typeof EMIResultCard>[0]['data']}
            />
          </div>
        )}

        {showExtras && partners.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {partners.map((p, i) => (
              <PartnerResultCard
                key={i}
                partner={p as Parameters<typeof PartnerResultCard>[0]['partner']}
                rank={i + 1}
              />
            ))}
          </div>
        )}

        {showExtras && comparison && (
          <div style={{ width: '100%' }}>
            <ComparisonCard
              schemeA={comparison.schemeA as Parameters<typeof ComparisonCard>[0]['schemeA']}
              schemeB={comparison.schemeB as Parameters<typeof ComparisonCard>[0]['schemeB']}
            />
          </div>
        )}

        {showExtras && documents.length > 0 && (
          <div style={{ width: '100%' }}>
            <DocumentCard
              documents={documents}
              note={msg.data?.note as string | undefined}
            />
          </div>
        )}

        {/* Grounding Disclaimer */}
        {showExtras && msg.disclaimer && (
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
              borderRadius: 12,
              width: '100%',
            }}
          >
            <Info size={16} color="#ea580c" style={{ flexShrink: 0 }} />
            <span>{msg.disclaimer}</span>
          </div>
        )}

        {/* Quick Action Chips */}
        {showExtras && msg.quickActions && msg.quickActions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            {msg.quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => onAction(qa.message)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#ffffff',
                  border: '1.5px solid #0b1f3a',
                  color: '#0b1f3a',
                  padding: '8px 16px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11,31,58,0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#0b1f3a';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(11,31,58,0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ffffff';
                  (e.currentTarget as HTMLElement).style.color = '#0b1f3a';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(11,31,58,0.06)';
                }}
              >
                <span>{qa.label}</span>
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  chatId?: string | null;
  token?: string | null;
  onChatCreated?: (chatId: string) => void;
  initialMessages?: ChatMessage[];
  initialQuery?: string | null;
}

export default function ChatInterface({
  chatId: propChatId,
  token,
  onChatCreated,
  initialMessages,
  initialQuery,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!initialMessages || initialMessages.length === 0) return [];
    return initialMessages.map((m) => ({
      id: String(m.id),
      role: m.role,
      text: m.content,
      type: m.type as ChatResponse['type'],
      data: m.data || undefined,
      quickActions: m.quick_actions || undefined,
      disclaimer: m.disclaimer || undefined,
    }));
  });

  const { lang: language, setLang: setLanguage, t } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(propChatId || '');
  const [showWelcome, setShowWelcome] = useState(!initialMessages?.length);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(propChatId || null);
  const initialSentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(
        initialMessages.map((m) => ({
          id: String(m.id),
          role: m.role,
          text: m.content,
          type: m.type as ChatResponse['type'],
          data: m.data || undefined,
          quickActions: m.quick_actions || undefined,
          disclaimer: m.disclaimer || undefined,
        }))
      );
      setShowWelcome(false);
    }
  }, [initialMessages]);

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random().toString(36).substring(2) },
    ]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      setShowWelcome(false);
      addMessage({ role: 'user', text });
      setInput('');
      setLoading(true);

      try {
        const res = await sendChat(
          text,
          sessionId || undefined,
          chatIdRef.current || undefined,
          token
        );
        const newChatId = res.chatId || res.sessionId;
        setSessionId(newChatId);
        if (!chatIdRef.current && res.chatId) {
          chatIdRef.current = res.chatId;
          onChatCreated?.(res.chatId);
        }

        addMessage({
          role: 'assistant',
          text: res.message,
          type: res.type,
          data: res.data,
          quickActions: res.quickActions,
          disclaimer: res.disclaimer,
          animate: true,
        });

        if (
          res.detectedLanguage === 'hi' ||
          res.detectedLanguage === 'mr' ||
          res.detectedLanguage === 'en'
        ) {
          setLanguage(res.detectedLanguage);
        }
      } catch (err) {
        addMessage({
          role: 'assistant',
          text: 'Unable to process your request at the moment. Please verify your network and try again.',
          animate: true,
        });
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, sessionId, token, onChatCreated, addMessage]
  );

  // Trigger query automatically if arriving with ?q=...
  useEffect(() => {
    if (initialQuery && !initialSentRef.current && messages.length === 0) {
      initialSentRef.current = true;
      send(initialQuery);
    }
  }, [initialQuery, messages.length, send]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const suggestionList = SUGGESTIONS[language] || SUGGESTIONS.en;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* ── Conversation Scroll Stream ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 880, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Welcome State when No Messages */}
          {showWelcome && messages.length === 0 && (
            <div
              style={{
                width: '100%',
                padding: '24px 0 36px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 28,
              }}
            >
              {/* Emblem & Brand Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(11,31,58,0.18)',
                  }}
                >
                  <Sparkles size={26} />
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef3f9', padding: '4px 12px', borderRadius: 20, border: '1px solid #dbe5f1' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0b1f3a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Government Loan Discovery Engine
                  </span>
                </div>

                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0b1f3a', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
                  {language === 'hi'
                    ? 'NSFDC प्रदर्शक AI सहायक'
                    : language === 'mr'
                    ? 'NSFDC प्रदर्शक AI सहाय्यक'
                    : 'Pradarshak AI Scheme Assistant'}
                </h1>

                <p style={{ fontSize: 15, color: '#64748b', maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
                  {language === 'hi'
                    ? 'अपनी जरूरत या व्यवसाय बताएं — हम सीधे आधिकारिक योजनाओं, EMI और निकटतम चैनल पार्टनर से जोड़ेंगे।'
                    : language === 'mr'
                    ? 'तुमची गरज किंवा व्यवसाय सांगा — आम्ही योग्य कर्ज योजना, EMI आणि जवळचे पार्टनर शोधू.'
                    : 'Describe your business idea, annual income, or educational goal to find verified concessional loan schemes.'}
                </p>

                {/* Language Selector Chips */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#e2e8f0',
                    padding: '4px',
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <Globe size={14} color="#64748b" style={{ marginLeft: 6, marginRight: 2 }} />
                  {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9,
                        fontSize: 12.5,
                        fontWeight: language === l ? 700 : 500,
                        border: 'none',
                        background: language === l ? '#ffffff' : 'transparent',
                        color: language === l ? '#0b1f3a' : '#475569',
                        boxShadow: language === l ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Suggestion Cards (2x2 Grid) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 16,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {suggestionList.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => send(item.query)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 16,
                        padding: '20px 22px',
                        boxShadow: '0 2px 8px rgba(11,31,58,0.03)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 148,
                        transition: 'all 180ms ease',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = '#0b1f3a';
                        el.style.transform = 'translateY(-2px)';
                        el.style.boxShadow = '0 8px 24px rgba(11,31,58,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = '#e2e8f0';
                        el.style.transform = 'translateY(0)';
                        el.style.boxShadow = '0 2px 8px rgba(11,31,58,0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: item.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={18} color={item.color} />
                          </div>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '3px 9px',
                              borderRadius: 20,
                              background: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                          {item.title}
                        </h3>

                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                          {item.desc}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#0b1f3a',
                          paddingTop: 12,
                          marginTop: 10,
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <span>Ask AI</span>
                        <ArrowRight size={13} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Messages Stream */}
          <div style={{ width: '100%' }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onAction={send} scrollRef={bottomRef} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, width: '100%' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #e87722, #d36513)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} />
                </div>
                <TypingIndicator />
              </div>
            )}
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Docked Bottom Input Bar ──────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '16px 24px 20px',
          flexShrink: 0,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 880, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 18,
              padding: '8px 12px 8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 180ms ease',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#0b1f3a';
              (e.currentTarget as HTMLElement).style.background = '#ffffff';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(11,31,58,0.08)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
              (e.currentTarget as HTMLElement).style.background = '#f8fafc';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'hi'
                  ? 'अपनी स्थिति या प्रश्न लिखें... (उदा. सिलाई दुकान के लिए कौन सा लोन मिलेगा?)'
                  : language === 'mr'
                  ? 'तुमची गरज किंवा प्रश्न विचारा... (उदा. व्यवसायासाठी कोणते कर्ज मिळेल?)'
                  : 'Ask anything about schemes, eligibility rules, monthly EMI, or channel partners...'
              }
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14.5,
                color: '#0f172a',
                padding: '6px 0',
                minHeight: 28,
                maxHeight: 120,
                lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
              disabled={loading}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />

            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: input.trim() && !loading ? '#0b1f3a' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 180ms ease',
              }}
              title="Send message (Enter)"
            >
              <Send size={17} color={input.trim() && !loading ? '#fbbf24' : '#ffffff'} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: 11.5, color: '#94a3b8' }}>
            <span>Press <kbd style={{ background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Enter ↵</kbd> to send</span>
            <span>Verified against official NSFDC scheme catalog data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
