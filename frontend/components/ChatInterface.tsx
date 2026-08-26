'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '@/lib/api';
import type { ChatResponse } from '@/lib/api';
import TypingIndicator from './TypingIndicator';
import SchemeResultCard from './SchemeResultCard';
import EMIResultCard from './EMIResultCard';
import PartnerResultCard from './PartnerResultCard';
import ComparisonCard from './ComparisonCard';
import DocumentCard from './DocumentCard';
import { Send, Mic } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  type?: ChatResponse['type'];
  data?: Record<string, unknown>;
  quickActions?: ChatResponse['quickActions'];
  disclaimer?: string;
}

type Language = 'en' | 'hi' | 'mr';

const LANG_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};

const QUICK_PROMPTS: Record<Language, { label: string; text: string }[]> = {
  en: [
    { label: '💼 Business loan', text: 'I want to start a small tailoring shop. My family earns about ₹2.5 lakh a year.' },
    { label: '🎓 Education loan', text: 'I need a loan for my engineering education.' },
    { label: '📊 Calculate EMI', text: 'Calculate EMI for ₹5 lakh at 7% for 5 years.' },
    { label: '📍 Find partner', text: 'Find the nearest partner in Delhi.' },
  ],
  hi: [
    { label: '💼 बिजनेस लोन', text: 'मुझे सिलाई का व्यवसाय शुरू करना है। परिवार की आय ₹2.5 लाख है।' },
    { label: '🎓 शिक्षा लोन', text: 'मुझे इंजीनियरिंग की पढ़ाई के लिए ऋण चाहिए।' },
    { label: '📊 EMI गणना', text: '₹5 लाख के लिए 7% ब्याज पर 5 साल की EMI क्या होगी?' },
    { label: '📍 पार्टनर खोजें', text: 'दिल्ली में सबसे नजदीकी पार्टनर खोजें।' },
  ],
  mr: [
    { label: '💼 व्यवसाय कर्ज', text: 'मला शिवणकाम सुरू करायचे आहे. कुटुंबाचे उत्पन्न ₹२.५ लाख आहे.' },
    { label: '🎓 शिक्षण कर्ज', text: 'मला अभियांत्रिकी शिक्षणासाठी कर्ज हवे आहे.' },
    { label: '📊 EMI काढा', text: '₹५ लाखांवर ७% व्याजाने ५ वर्षांसाठी EMI किती?' },
    { label: '📍 जवळचे पार्टनर', text: 'मुंबईत जवळचे चॅनेल पार्टनर शोधा.' },
  ],
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function MessageText({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {text.split('\n').map((line, i) => (
        <div key={i}>{renderText(line)}</div>
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, onAction }: { msg: Message; onAction: (text: string) => void }) {
  const isUser = msg.role === 'user';

  const schemes = msg.type === 'schemes' ? (msg.data?.schemes as unknown[]) || [] : [];
  const emiData = msg.type === 'emi' ? msg.data : null;
  const partners = msg.type === 'partners' ? (msg.data?.partners as unknown[]) || [] : [];
  const comparison = msg.type === 'comparison' ? msg.data : null;
  const documents = msg.type === 'documents' ? (msg.data?.documents as string[]) || [] : [];

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
        style={{ background: isUser ? '#6b7280' : 'var(--accent)' }}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Main bubble */}
        <div
          className="px-4 py-3 rounded-2xl"
          style={isUser
            ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 4 }
            : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)', borderBottomLeftRadius: 4 }
          }
        >
          <MessageText text={msg.text} />
        </div>

        {/* Structured data cards */}
        {schemes.length > 0 && (
          <div className="mt-2 w-full">
            {schemes.map((s, i) => (
              <SchemeResultCard
                key={i}
                scheme={s as Parameters<typeof SchemeResultCard>[0]['scheme']}
                rank={i + 1}
                onCalculateEMI={() => onAction(`Calculate EMI for the ${(s as { name: string }).name} scheme`)}
                onFindPartners={() => onAction('Find nearest partner for applying')}
              />
            ))}
          </div>
        )}

        {emiData && (
          <div className="mt-2 w-full">
            <EMIResultCard data={emiData as unknown as Parameters<typeof EMIResultCard>[0]['data']} />
          </div>
        )}

        {partners.length > 0 && (
          <div className="mt-2 w-full">
            {partners.map((p, i) => (
              <PartnerResultCard
                key={i}
                partner={p as Parameters<typeof PartnerResultCard>[0]['partner']}
                rank={i + 1}
              />
            ))}
          </div>
        )}

        {comparison && (
          <div className="mt-2 w-full">
            <ComparisonCard
              schemeA={comparison.schemeA as Parameters<typeof ComparisonCard>[0]['schemeA']}
              schemeB={comparison.schemeB as Parameters<typeof ComparisonCard>[0]['schemeB']}
            />
          </div>
        )}

        {documents.length > 0 && (
          <div className="mt-2 w-full">
            <DocumentCard
              documents={documents}
              note={msg.data?.note as string | undefined}
            />
          </div>
        )}

        {/* Disclaimer */}
        {msg.disclaimer && (
          <div className="mt-2 text-xs px-3 py-1.5 rounded-lg max-w-full" style={{ background: '#fef9c3', color: '#854d0e' }}>
            ℹ️ {msg.disclaimer}
          </div>
        )}

        {/* Quick actions */}
        {msg.quickActions && msg.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => onAction(qa.message)}
                className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  background: 'var(--surface)',
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ChatInterface ────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  chatId?: string | null;
  token?: string | null;
  onChatCreated?: (chatId: string) => void;
  initialMessages?: Message[];
}

export default function ChatInterface({ chatId: propChatId, token, onChatCreated, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(propChatId || '');
  const [language, setLanguage] = useState<Language>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!initialMessages?.length);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(propChatId || null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setShowWelcome(false);
    addMessage({ role: 'user', text });
    setInput('');
    setLoading(true);

    try {
      const res = await sendChat(text, sessionId || undefined, chatIdRef.current || undefined, token);
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
      });

      // Update UI language from detected language
      if (res.detectedLanguage === 'hi' || res.detectedLanguage === 'mr' || res.detectedLanguage === 'en') {
        setLanguage(res.detectedLanguage);
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
      });
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, sessionId, addMessage]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const prompts = QUICK_PROMPTS[language];

  return (
    <div className="flex flex-col h-full">
      {/* Language selector */}
      <div className="flex justify-end px-4 py-2 border-b relative" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <button
          onClick={() => setShowLangMenu((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          🌐 {LANG_LABELS[language]}
        </button>
        {showLangMenu && (
          <div
            className="absolute right-4 top-10 z-50 rounded-xl shadow-lg overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {(Object.entries(LANG_LABELS) as [Language, string][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setLanguage(k); setShowLangMenu(false); }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:opacity-70"
                style={{
                  color: k === language ? 'var(--accent)' : 'var(--foreground)',
                  background: 'transparent',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {showWelcome && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--accent)' + '1a' }}
            >
              <span className="text-3xl">🏦</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {language === 'hi' ? 'NSFDC वित्तीय सहायता' : language === 'mr' ? 'NSFDC आर्थिक सहाय्य' : 'NSFDC Financial Assistance'}
            </h2>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--muted)' }}>
              {language === 'hi'
                ? 'अनुसूचित जाति लाभार्थियों के लिए सरकारी ऋण योजनाएं खोजें'
                : language === 'mr'
                  ? 'अनुसूचित जातीच्या लाभार्थ्यांसाठी सरकारी कर्ज योजना शोधा'
                  : 'Find government loan schemes for Scheduled Caste beneficiaries'}
            </p>

            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p.text)}
                  className="text-left text-xs p-3 rounded-xl border transition-colors hover:opacity-80"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onAction={send} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'hi' ? 'अपनी जरूरत बताएं... (कोई भी भाषा में)' :
              language === 'mr' ? 'तुमची गरज सांगा... (कोणत्याही भाषेत)' :
              'Describe your need in any language...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none"
            style={{ color: 'var(--foreground)', maxHeight: 120, minHeight: 24 }}
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
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
            style={{ background: 'var(--accent)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="text-center text-xs mt-2" style={{ color: 'var(--muted)' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
