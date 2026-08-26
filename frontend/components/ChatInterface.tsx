'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '@/lib/api';
import type { ChatResponse, ChatMessage } from '@/lib/api';
import TypingIndicator from './TypingIndicator';
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
  Globe,
  Briefcase,
  GraduationCap,
  Calculator,
  MapPin,
  HeartHandshake
} from 'lucide-react';

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
  hi: 'हिंदी (Hindi)',
  mr: 'मराठी (Marathi)',
};

const CATEGORIZED_PROMPTS: Record<
  Language,
  { label: string; text: string; icon: React.ElementType }[]
> = {
  en: [
    {
      label: 'Small Business / Shop',
      text: 'I want to open a tailoring and garment shop. Family income is ₹2.5 Lakh/yr. Which loan can I get?',
      icon: Briefcase,
    },
    {
      label: 'Higher Education Loan',
      text: 'I need an education loan for an engineering degree. How much can I get and at what interest rate?',
      icon: GraduationCap,
    },
    {
      label: 'Mahila Samriddhi Scheme',
      text: 'Tell me about schemes exclusively for SC women entrepreneurs and self-help groups.',
      icon: HeartHandshake,
    },
    {
      label: 'Calculate ₹5L EMI',
      text: 'Calculate monthly EMI for ₹5 Lakh loan at 7% interest for 5 years with a 6-month moratorium.',
      icon: Calculator,
    },
    {
      label: 'Find Nearest Partner',
      text: 'Find the nearest active Channel Partners and State Channelizing Agencies in Delhi.',
      icon: MapPin,
    },
  ],
  hi: [
    {
      label: 'छोटा व्यवसाय / दुकान',
      text: 'मुझे सिलाई और कपड़ों की दुकान खोलनी है। परिवार की सालाना आय ₹2.5 लाख है। मुझे कौन सी योजना मिलेगी?',
      icon: Briefcase,
    },
    {
      label: 'उच्च शिक्षा ऋण',
      text: 'मुझे बीटेक/इंजीनियरिंग के लिए एजुकेशन लोन चाहिए। ब्याज दर और अधिकतम सीमा क्या है?',
      icon: GraduationCap,
    },
    {
      label: 'महिला समृद्धि योजना',
      text: 'अनुसूचित जाति की महिलाओं के लिए विशेष योजनाओं और सब्सिडी के बारे में बताएं।',
      icon: HeartHandshake,
    },
    {
      label: '₹5 लाख EMI गणना',
      text: '₹5 लाख के कर्ज पर 7% ब्याज और 5 साल की अवधि के लिए मासिक EMI क्या बनेगी?',
      icon: Calculator,
    },
    {
      label: 'नजदीकी पार्टनर खोजें',
      text: 'दिल्ली/लखनऊ में निकटतम चैनल पार्टनर और बैंक की जानकारी दें।',
      icon: MapPin,
    },
  ],
  mr: [
    {
      label: 'लहान व्यवसाय / दुकान',
      text: 'मला शिवणकाम व कपड्यांचे दुकान सुरू करायचे आहे. कौटुंबिक उत्पन्न ₹२.५ लाख आहे. कोणती योजना मिळेल?',
      icon: Briefcase,
    },
    {
      label: 'उच्च शिक्षण कर्ज',
      text: 'अभियांत्रिकी शिक्षणासाठी मला कर्ज हवे आहे. कमाल मर्यादा आणि व्याज दर काय आहे?',
      icon: GraduationCap,
    },
    {
      label: 'महिलांसाठी योजना',
      text: 'अनुसूचित जातीच्या महिलांसाठी उपलब्ध असलेल्या विशेष योजनांची माहिती द्या.',
      icon: HeartHandshake,
    },
    {
      label: 'EMI मोजा',
      text: '५ लाख रुपयांवर ७% दराने ५ वर्षांसाठी मासिक हप्ता किती येईल?',
      icon: Calculator,
    },
    {
      label: 'जवळचे पार्टनर',
      text: 'मुंबई / पुण्यातील जवळचे चॅनेल पार्टनर आणि पत्ते दाखवा.',
      icon: MapPin,
    },
  ],
};

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function MessageBubble({
  msg,
  onAction,
}: {
  msg: Message;
  onAction: (text: string) => void;
}) {
  const isUser = msg.role === 'user';

  const schemes = msg.type === 'schemes' ? (msg.data?.schemes as unknown[]) || [] : [];
  const emiData = msg.type === 'emi' ? msg.data : null;
  const partners = msg.type === 'partners' ? (msg.data?.partners as unknown[]) || [] : [];
  const comparison = msg.type === 'comparison' ? msg.data : null;
  const documents = msg.type === 'documents' ? (msg.data?.documents as string[]) || [] : [];

  return (
    <div
      className={`flex items-start gap-3.5 mb-6 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } animate-fade-in`}
    >
      {/* Role Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser
            ? 'bg-[#0b1f3a] text-white'
            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Bubble + Attachments Container */}
      <div className={`flex flex-col space-y-3 ${isUser ? 'items-end' : 'items-start'} max-w-2xl w-full`}>
        
        {/* Text Bubble */}
        <div
          className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-[#0b1f3a] text-white rounded-tr-xs'
              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
          }`}
        >
          <div className="whitespace-pre-wrap space-y-1">
            {msg.text.split('\n').map((line, i) => (
              <p key={i}>{renderText(line)}</p>
            ))}
          </div>
        </div>

        {/* Structured Data Result Cards */}
        {schemes.length > 0 && (
          <div className="w-full space-y-3 pt-1">
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

        {emiData && (
          <div className="w-full pt-1">
            <EMIResultCard data={emiData as unknown as Parameters<typeof EMIResultCard>[0]['data']} />
          </div>
        )}

        {partners.length > 0 && (
          <div className="w-full space-y-3 pt-1">
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
          <div className="w-full pt-1">
            <ComparisonCard
              schemeA={comparison.schemeA as Parameters<typeof ComparisonCard>[0]['schemeA']}
              schemeB={comparison.schemeB as Parameters<typeof ComparisonCard>[0]['schemeB']}
            />
          </div>
        )}

        {documents.length > 0 && (
          <div className="w-full pt-1">
            <DocumentCard
              documents={documents}
              note={msg.data?.note as string | undefined}
            />
          </div>
        )}

        {/* Grounding Disclaimer */}
        {msg.disclaimer && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{msg.disclaimer}</span>
          </div>
        )}

        {/* Quick Action Chips */}
        {msg.quickActions && msg.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {msg.quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => onAction(qa.message)}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-[#0b1f3a] font-semibold px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer"
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

interface ChatInterfaceProps {
  chatId?: string | null;
  token?: string | null;
  onChatCreated?: (chatId: string) => void;
  initialMessages?: ChatMessage[];
}

export default function ChatInterface({
  chatId: propChatId,
  token,
  onChatCreated,
  initialMessages,
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(propChatId || '');
  const [language, setLanguage] = useState<Language>('en');
  const [showWelcome, setShowWelcome] = useState(!initialMessages?.length);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(propChatId || null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
          text: 'Unable to process your request at the moment. Please verify your connection and try again.',
        });
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, sessionId, token, onChatCreated, addMessage]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const prompts = CATEGORIZED_PROMPTS[language] || CATEGORIZED_PROMPTS.en;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      
      {/* ── Conversation Scroll Stream ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Welcome Screen when Empty */}
          {showWelcome && messages.length === 0 && (
            <div className="py-8 sm:py-14 text-center max-w-2xl mx-auto animate-fade-up">
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0b1f3a] to-[#1a3a60] text-white flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] mb-2 tracking-tight">
                {language === 'hi'
                  ? 'NSFDC प्रदर्शक AI सहायक'
                  : language === 'mr'
                  ? 'NSFDC प्रदर्शक AI सहाय्यक'
                  : 'Pradarshak AI Scheme Assistant'}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
                {language === 'hi'
                  ? 'अपनी स्थिति बताएं — हम तुरंत पात्र योजनाएं, वास्तविक EMI और निकटतम चैनल पार्टनर ढूंढेंगे।'
                  : language === 'mr'
                  ? 'तुमची गरज सांगा — आम्ही योग्य कर्ज योजना, EMI आणि जवळचे पार्टनर शोधू.'
                  : 'Tell us about your venture, income, or educational goals to find eligible concessional loans.'}
              </p>

              {/* Categorized Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {prompts.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => send(p.text)}
                      className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 p-4 rounded-xl shadow-xs hover:shadow-sm text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                          {p.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {p.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Messages List */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onAction={send} />
          ))}

          {loading && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Fixed Bottom Message Bar ────────────────────────────────────────── */}
      <div className="border-t border-slate-200 bg-white p-4 sm:p-5 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 shadow-inner focus-within:border-[#0b1f3a] focus-within:bg-white transition-all">
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'hi'
                  ? 'अपनी स्थिति या प्रश्न लिखें... (हिंदी, मराठी या English)'
                  : language === 'mr'
                  ? 'तुमची अडचण किंवा प्रश्न लिहा... (कोणत्याही भाषेत)'
                  : 'Ask about eligibility, schemes, EMI calculation, or channel partners...'
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none max-h-28 min-h-[26px] py-1"
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
              className="w-10 h-10 rounded-xl bg-[#0b1f3a] hover:bg-[#132e54] text-white flex items-center justify-center flex-shrink-0 shadow transition-all disabled:opacity-40 disabled:hover:bg-[#0b1f3a] cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
            <span className="hidden sm:inline">Grounded with official NSFDC catalog data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
