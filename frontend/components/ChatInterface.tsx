'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendChat, fetchTTS, transcribeAudio } from '@/lib/api';
import type { ChatResponse, ChatMessage, Scheme } from '@/lib/api';
import TypingIndicator from './TypingIndicator';
import TypewriterText from './TypewriterText';
import SchemeResultCard from './SchemeResultCard';
import EMIResultCard from './EMIResultCard';
import PartnerResultCard from './PartnerResultCard';
import ComparisonCard from './ComparisonCard';
import DocumentCard from './DocumentCard';
import VoiceVisualizer from './VoiceVisualizer';
import VoiceButton from './VoiceButton';
import EmblemOfIndia from './EmblemOfIndia';
import {
  buildSchemeSpeech,
  buildDocumentsSpeech,
  buildEmiSpeech,
  buildComparisonSpeech,
} from '@/lib/speechBuilders';
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
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Square,
  Loader2,
  MapPin,
  Scale,
  BookOpen,
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
  speechText?: string;
  /** True only for freshly-received assistant replies — drives the typing
   *  animation. Messages loaded from chat history render instantly. */
  animate?: boolean;
}

type SuggestionItem = {
  id: string;
  title: string;
  desc: string;
  query: string;
  icon: React.ElementType;
  tag: string;
  color: string;
  bg: string;
};

const SUGGESTIONS: Record<string, SuggestionItem[]> = {
  en: [
    {
      id: 'small-business',
      title: 'Small Business & Trade Loan',
      desc: 'Concessional loans up to ₹50 Lakh for tailoring units, kirana shops, or service ventures with family income ≤ ₹5L.',
      query: 'I want to start a small tailoring shop. Family income is about ₹2.5 Lakh a year. What scheme can I get?',
      icon: Briefcase,
      tag: 'Term Loan / Micro',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      id: 'education',
      title: 'Higher & Technical Education Loan',
      desc: 'Subsidized 4%–6% interest loans covering tuition, hostel, and equipment for engineering, medical, or professional degrees.',
      query: 'I need an education loan for an engineering degree. How much loan can I get and at what interest rate?',
      icon: GraduationCap,
      tag: 'Education Loan',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      id: 'women-exclusive',
      title: 'Mahila Samriddhi Yojana',
      desc: 'Exclusive micro-credit up to ₹1.40 Lakh at concessional 4% interest designed specifically for SC women entrepreneurs.',
      query: 'Tell me about Mahila Samriddhi Yojana and schemes exclusively for SC women.',
      icon: HeartHandshake,
      tag: 'Women Exclusive',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      id: 'emi-calculation',
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
      id: 'small-business',
      title: 'छोटा व्यवसाय एवं दुकान ऋण',
      desc: 'सिलाई, किराना दुकान या सेवा व्यवसाय के लिए ₹1.40L से ₹50L तक रियायती सरकारी ऋण (पारिवारिक आय ≤ ₹5 लाख)।',
      query: 'मुझे सिलाई और कपड़ों की दुकान खोलनी है। परिवार की सालाना आय ₹2.5 लाख है। मुझे कौन सी योजना मिलेगी?',
      icon: Briefcase,
      tag: 'व्यवसाय ऋण',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      id: 'education',
      title: 'उच्च एवं तकनीकी शिक्षा ऋण',
      desc: 'इंजीनियरिंग, मेडिकल और वोकेशनल पढ़ाई के लिए 4%–6% की कम ब्याज दर पर शिक्षा ऋण सहायता।',
      query: 'मुझे बी.टेक/इंजीनियरिंग के लिए एजुकेशन लोन चाहिए। ब्याज दर और अधिकतम सीमा क्या है?',
      icon: GraduationCap,
      tag: 'शिक्षा ऋण',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      id: 'women-exclusive',
      title: 'महिला समृद्धि योजना',
      desc: 'अनुसूचित जाति की महिला उद्यमियों के लिए 4% ब्याज पर ₹1.40 लाख तक विशेष सहायता।',
      query: 'अनुसूचित जाति की महिलाओं के लिए महिला समृद्धि योजना के बारे में विस्तार से बताएं।',
      icon: HeartHandshake,
      tag: 'महिला विशेष',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      id: 'emi-calculation',
      title: 'मासिक ईएमआई (EMI) एवं मोरेटोरियम गणना',
      desc: 'ब्याज दर और 3 से 12 महीने की छूट अवधि (मोरेटोरियम) के साथ सटीक मासिक किस्त की गणना करें।',
      query: '₹5 लाख के कर्ज पर 7% ब्याज और 5 साल की अवधि के लिए मासिक EMI क्या बनेगी?',
      icon: Calculator,
      tag: 'EMI कैलकुलेटर',
      color: '#15803d',
      bg: '#f0fdf4',
    },
  ],
  pa: [
    {
      id: 'small-business',
      title: 'ਛੋਟਾ ਵਿਵਸਾਇ / ਦੁਕਾਨ ਰਿਣ',
      desc: 'ਸਿਲਾਈ, ਕਿਰਾਣਾ ਯਾ ਵ੍ਯਾਪਾਰ ਲਈ ₹1.40L ਤੋਂ ₹50L ਤੱਕ ਰਿਆਇਤੀ ਸਰਕਾਰੀ ਰਿਣ (ਪਰਿਵਾਰਿਕ ਆਮਦਨ ≤ ₹5 ਲੱਖ)।',
      query: 'ਮੈਨੂੰ ਸਿਲਾਈ ਅਤੇ ਕਪੜਿਆਂ ਦੀ ਦੁਕਾਨ ਖੋਲ੍ਹਣੀ ਹੈ। ਪਰਿਵਾਰ ਦੀ ਸਾਲਾਨਾ ਆਮਦਨ ₹2.5 ਲੱਖ ਹੈ। ਮੈਨੂੰ ਕਿਹੜੀ ਯੋਜਨਾ ਮਿਲੇਗੀ?',
      icon: Briefcase,
      tag: 'ਵ੍ਯਵਸਾਇ ਰਿਣ',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      id: 'education',
      title: 'ਉੱਚ ਅਤੇ ਤਕਨੀਕੀ ਸਿੱਖਿਆ ਰਿਣ',
      desc: 'ਇੰਜੀਨੀਅਰਿੰਗ, ਮੈਡੀਕਲ ਅਤੇ ਵੋਕੇਸ਼ਨਲ ਪੜ੍ਹਾਈ ਲਈ 4%–6% ਦੀ ਘੱਟ ਵਿਆਜ ਦਰ ਤੇ ਸਿੱਖਿਆ ਰਿਣ ਸਹਾਇਤਾ।',
      query: 'ਮੈਨੂੰ ਬੀ.ਟੈਕ/ਇੰਜੀਨੀਅਰਿੰਗ ਲਈ ਐਜੂਕੇਸ਼ਨ ਲੋਨ ਚਾਹੀਦਾ ਹੈ। ਵਿਆਜ ਦਰ ਅਤੇ ਅਧਿਕਤਮ ਸੀਮਾ ਕੀ ਹੈ?',
      icon: GraduationCap,
      tag: 'ਸਿੱਖਿਆ ਰਿਣ',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      id: 'women-exclusive',
      title: 'ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ',
      desc: 'ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੀਆਂ ਮਹਿਲਾ ਉੱਦਮੀਆਂ ਲਈ 4% ਵਿਆਜ ਤੇ ₹1.40 ਲੱਖ ਤੱਕ ਵਿਸ਼ੇਸ਼ ਸਹਾਇਤਾ।',
      query: 'ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੀਆਂ ਮਹਿਲਾਵਾਂ ਲਈ ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ ਬਾਰੇ ਵਿਸਥਾਰ ਨਾਲ ਦੱਸੋ।',
      icon: HeartHandshake,
      tag: 'ਮਹਿਲਾ ਵਿਸ਼ੇਸ਼',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      id: 'emi-calculation',
      title: 'ਮਹੀਨਾਵਾਰ EMI ਅਤੇ ਮੋਰਟੋਰੀਅਮ ਗਣਨਾ',
      desc: 'ਵਿਆਜ ਦਰ ਅਤੇ 3 ਤੋਂ 12 ਮਹੀਨੇ ਦੀ ਗ੍ਰੇਸ ਮਿਆਦ (ਮੋਰਟੋਰੀਅਮ) ਨਾਲ ਸਟੀਕ ਮਹੀਨਾਵਾਰ ਕਿਸ਼ਤ ਦੀ ਗਣਨਾ ਕਰੋ।',
      query: '₹5 ਲੱਖ ਦੇ ਕਰਜ਼ੇ ਤੇ 7% ਵਿਆਜ ਅਤੇ 5 ਸਾਲ ਦੀ ਮਿਆਦ ਲਈ ਮਹੀਨਾਵਾਰ EMI ਕੀ ਬਣੇਗੀ?',
      icon: Calculator,
      tag: 'EMI ਕੈਲਕੁਲੇਟਰ',
      color: '#15803d',
      bg: '#f0fdf4',
    },
  ],
  mr: [
    {
      id: 'small-business',
      title: 'लहान व्यवसाय व दुकान कर्ज',
      desc: 'शिवणकाम, किराणा दुकान किंवा व्यवसायासाठी सवलतीच्या दरात ₹५० लाखांपर्यंत कर्ज सहाय्य.',
      query: 'मला शिवणकाम व कपड्यांचे दुकान सुरू करायचे आहे. कौटुंबिक उत्पन्न ₹२.५ लाख आहे. कोणती योजना मिळेल?',
      icon: Briefcase,
      tag: 'व्यवसाय कर्ज',
      color: '#0b1f3a',
      bg: '#eff6ff',
    },
    {
      id: 'education',
      title: 'उच्च शिक्षण कर्ज योजना',
      desc: 'अभियांत्रिकी व वैद्यकीय शिक्षणासाठी ४%–६% सवलतीच्या व्याजदरात शैक्षणिक कर्ज.',
      query: 'अभियांत्रिकी शिक्षणासाठी मला कर्ज हवे आहे. कमाल मर्यादा आणि व्याज दर काय आहे?',
      icon: GraduationCap,
      tag: 'शिक्षण कर्ज',
      color: '#7e22ce',
      bg: '#fdf4ff',
    },
    {
      id: 'women-exclusive',
      title: 'महिला समृद्धी योजना',
      desc: 'अनुसूचित जातीच्या महिला उद्योजकांसाठी ४% व्याजदरावर ₹१.४० लाखांपर्यंत विशेष कर्ज.',
      query: 'अनुसूचित जातीच्या महिलांसाठी उपलब्ध असलेल्या विशेष योजनांची माहिती द्या.',
      icon: HeartHandshake,
      tag: 'महिला विशेष',
      color: '#c2410c',
      bg: '#fff7ed',
    },
    {
      id: 'emi-calculation',
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
  onStepComplete,
  scrollRef,
  playingMessageId,
  loadingTTSMessageId,
  playingVoiceId,
  loadingVoiceId,
  onPlayTTS,
  onStopTTS,
  onPlayVoice,
  onStopVoice,
  t,
  onSchemeAction,
  onCompareSchemes,
  onOpenPartners,
  onOpenEMI,
}: {
  msg: Message;
  onAction: (text: string) => void;
  onStepComplete?: (stepKey: 'eligibility' | 'scheme' | 'emi' | 'partner') => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  playingMessageId?: string | null;
  loadingTTSMessageId?: string | null;
  playingVoiceId?: string | null;
  loadingVoiceId?: string | null;
  onPlayTTS?: (msg: Message) => void;
  onStopTTS?: () => void;
  onPlayVoice?: (voiceId: string, text: string) => void;
  onStopVoice?: () => void;
  t: (key: string, fallback?: string) => string;
  onSchemeAction?: (action: 'KNOW_MORE' | 'DOCUMENTS' | 'EMI', scheme: any) => void;
  onCompareSchemes?: (schemes: any[]) => void;
  onOpenPartners?: () => void;
  onOpenEMI?: (schemeId?: number) => void;
}) {
  const isUser = msg.role === 'user';
  const { language } = useLanguage();
  const [textDone, setTextDone] = useState(!msg.animate);
  const showExtras = !msg.animate || textDone;

  const activePlayingId = playingVoiceId ?? playingMessageId ?? null;
  const activeLoadingId = loadingVoiceId ?? loadingTTSMessageId ?? null;
  const isPlaying = activePlayingId === msg.id;
  const isThisLoading = activeLoadingId === msg.id;

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
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? '#001e40' : '#ffffff',
          border: isUser ? '1px solid #001e40' : '1.5px solid #cbd5e1',
          color: isUser ? '#ffffff' : '#001e40',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          padding: isUser ? 0 : 3,
        }}
      >
        {isUser ? <User size={18} /> : <EmblemOfIndia size={28} />}
      </div>

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
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 18,
            borderTopRightRadius: isUser ? 4 : 18,
            borderTopLeftRadius: isUser ? 18 : 4,
            fontSize: 14.5,
            lineHeight: 1.65,
            background: isUser ? 'var(--navy, #001e40)' : 'var(--surface)',
            color: isUser ? '#ffffff' : 'var(--text)',
            border: isUser ? 'none' : '1px solid var(--border)',
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
                color="var(--text)"
                onTick={() => scrollRef?.current?.scrollIntoView({ behavior: 'auto', block: 'end' })}
                onDone={() => setTextDone(true)}
              />
            )}
          </div>

          {!isUser && (onPlayVoice || onPlayTTS) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <VoiceButton
                text={msg.speechText || msg.text}
                isPlaying={isPlaying}
                isLoading={isThisLoading}
                isAnyLoading={Boolean(activeLoadingId) && !isThisLoading}
                onPlay={() => {
                  const textToPlay = msg.speechText || msg.text;
                  if (onPlayVoice) onPlayVoice(msg.id, textToPlay);
                  else if (onPlayTTS) onPlayTTS(msg);
                }}
                onStop={() => {
                  if (onStopVoice) onStopVoice();
                  else if (onStopTTS) onStopTTS();
                }}
                variant="subtle"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Structured Data Result Cards — held back until the reply finishes typing */}
        {showExtras && schemes.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {schemes.map((s: any, i: number) => {
              const schemeVoiceId = `scheme_${msg.id}_${s.id || i}`;
              const schemeSpeech = buildSchemeSpeech(s, language);
              return (
                <SchemeResultCard
                  key={s.id || i}
                  scheme={s as Parameters<typeof SchemeResultCard>[0]['scheme']}
                  rank={i + 1}
                  onKnowMore={() => {
                    onSchemeAction?.('KNOW_MORE', s);
                  }}
                  onGetDocuments={() => {
                    onSchemeAction?.('DOCUMENTS', s);
                  }}
                  onCalculateEMI={() => {
                    onStepComplete?.('scheme');
                    onStepComplete?.('emi');
                    onSchemeAction?.('EMI', s);
                  }}
                  speechText={schemeSpeech}
                  isVoicePlaying={activePlayingId === schemeVoiceId}
                  isVoiceLoading={activeLoadingId === schemeVoiceId}
                  onPlayVoice={() => onPlayVoice?.(schemeVoiceId, schemeSpeech)}
                  onStopVoice={onStopVoice}
                />
              );
            })}

            {/* Separate Global Actions Area (after ALL schemes) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                paddingTop: 10,
                borderTop: '1.5px dashed #cbd5e1',
                marginTop: 4,
              }}
            >
              {schemes.length > 1 && onCompareSchemes && (
                <button
                  type="button"
                  onClick={() => onCompareSchemes(schemes)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: '#0b1f3a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(11,31,58,0.15)',
                    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#1e3a8a';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#0b1f3a';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <Scale size={15} color="#fbbf24" />
                  <span>{t('scheme.compare_btn')} ({schemes.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onStepComplete?.('partner');
                  if (onOpenPartners) {
                    onOpenPartners();
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: '#ffffff',
                  color: '#0b1f3a',
                  fontSize: 13,
                  fontWeight: 700,
                  border: '1.5px solid #0b1f3a',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11,31,58,0.06)',
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                  (e.currentTarget as HTMLElement).style.borderColor = '#1e3a8a';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ffffff';
                  (e.currentTarget as HTMLElement).style.borderColor = '#0b1f3a';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <MapPin size={15} color="#e87722" />
                <span>{t('scheme.know_partners')}</span>
              </button>
            </div>
          </div>
        )}

        {showExtras && emiData && (() => {
          const emiVoiceId = `emi_${msg.id}`;
          const emiSpeech = buildEmiSpeech(emiData, language);
          return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <EMIResultCard
                data={emiData as unknown as Parameters<typeof EMIResultCard>[0]['data']}
                speechText={emiSpeech}
                isVoicePlaying={activePlayingId === emiVoiceId}
                isVoiceLoading={activeLoadingId === emiVoiceId}
                onPlayVoice={() => onPlayVoice?.(emiVoiceId, emiSpeech)}
                onStopVoice={onStopVoice}
              />
              {onOpenEMI && (
                <button
                  type="button"
                  onClick={() => {
                    const sid = (emiData as any).schemeId || (emiData as any).scheme?.id;
                    onOpenEMI(sid);
                  }}
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
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#ea580c';
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#fff7ed';
                    (e.currentTarget as HTMLElement).style.color = '#9a3412';
                  }}
                >
                  <Calculator size={14} />
                  <span>{t('scheme.open_calculator')}</span>
                </button>
              )}
            </div>
          );
        })()}

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

        {showExtras && comparison && (() => {
          const compVoiceId = `comp_${msg.id}`;
          const schemesList = (comparison.schemes as any[]) || [comparison.schemeA, comparison.schemeB].filter(Boolean);
          const compSpeech = msg.speechText || (comparison.speechText as string) || buildComparisonSpeech(schemesList, language);
          return (
            <div style={{ width: '100%' }}>
              <ComparisonCard
                schemes={schemesList}
                schemeA={comparison.schemeA as any}
                schemeB={comparison.schemeB as any}
                onCalculateEMI={(s) => onSchemeAction?.('EMI', s)}
                onKnowMore={(s) => onSchemeAction?.('KNOW_MORE', s)}
                speechText={compSpeech}
                isPlaying={activePlayingId === compVoiceId}
                isLoadingTTS={activeLoadingId === compVoiceId}
                onPlayTTS={() => onPlayVoice?.(compVoiceId, compSpeech)}
                onStopTTS={onStopVoice}
              />
            </div>
          );
        })()}

        {showExtras && documents.length > 0 && (() => {
          const docVoiceId = `doc_${msg.id}`;
          const schemeName = (msg.data?.schemeName || msg.data?.scheme_name || (msg.data?.scheme as any)?.name) as string | undefined;
          const docSpeech = buildDocumentsSpeech(documents, schemeName, msg.data?.note as string | undefined, language);
          return (
            <div style={{ width: '100%' }}>
              <DocumentCard
                documents={documents}
                schemeName={schemeName}
                note={msg.data?.note as string | undefined}
                speechText={docSpeech}
                isVoicePlaying={activePlayingId === docVoiceId}
                isVoiceLoading={activeLoadingId === docVoiceId}
                onPlayVoice={() => onPlayVoice?.(docVoiceId, docSpeech)}
                onStopVoice={onStopVoice}
              />
            </div>
          );
        })()}

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
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
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
  resetKey?: number;
  token?: string | null;
  onChatCreated?: (chatId: string) => void;
  onStepComplete?: (stepKey: 'eligibility' | 'scheme' | 'emi' | 'partner') => void;
  initialMessages?: ChatMessage[];
  initialQuery?: string | null;
  category?: string | null;
}

export default function ChatInterface({
  chatId: propChatId,
  resetKey,
  token,
  onChatCreated,
  onStepComplete,
  initialMessages,
  initialQuery,
  category,
}: ChatInterfaceProps) {
  const router = useRouter();
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
      speechText: (m.speechText || (m as any).speech_text || (m.data as any)?.speechText) as string | undefined,
    }));
  });

  const { lang: language, isAuto, updateDetectedLang, setLang: setLanguage, t } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(propChatId || '');
  const [showWelcome, setShowWelcome] = useState(!initialMessages?.length);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [sttDetectedLang, setSttDetectedLang] = useState<{
    code: string | null;
    probability: number | null;
  }>({ code: null, probability: null });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingVoiceId(null);
    setLoadingVoiceId(null);
  }, []);

  const fallbackBrowserSpeech = useCallback((text: string, lang: string, voiceId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = {
        hi: 'hi-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        od: 'or-IN',
        pa: 'pa-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        en: 'en-IN',
      };
      utterance.lang = langMap[lang] || 'en-IN';
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      if (voiceId) setPlayingVoiceId(voiceId);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('[browser-tts-error]', e);
      setPlayingVoiceId(null);
    }
  }, []);

  const handlePlayVoice = useCallback(
    async (voiceId: string, speechText: string) => {
      stopAudio();
      setLoadingVoiceId(voiceId);
      setSpeechError(null);

      const cleanText = speechText.replace(/[#*`_\[\]]/g, '').trim();
      if (!cleanText) {
        setLoadingVoiceId(null);
        return;
      }

      try {
        const blob = await fetchTTS(cleanText, language);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          stopAudio();
        };
        audio.onerror = () => {
          stopAudio();
          setPlayingVoiceId(voiceId);
          fallbackBrowserSpeech(cleanText, language, voiceId);
        };

        setLoadingVoiceId(null);
        setPlayingVoiceId(voiceId);
        await audio.play();
      } catch (err) {
        console.warn('[tts-fetch-fallback]', err);
        setLoadingVoiceId(null);
        setPlayingVoiceId(voiceId);
        fallbackBrowserSpeech(cleanText, language, voiceId);
      }
    },
    [language, stopAudio, fallbackBrowserSpeech]
  );

  const handlePlayTTS = useCallback(
    (msg: Message) => {
      const rawSpeech = msg.speechText || msg.text || '';
      handlePlayVoice(msg.id, rawSpeech);
    },
    [handlePlayVoice]
  );

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(propChatId || null);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
        !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined')
    );
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setActiveStream(null);
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setSpeechError(null);

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function' || typeof MediaRecorder === 'undefined') {
      setSpeechSupported(false);
      setSpeechError('Microphone recording is not supported by your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setActiveStream(stream);
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setActiveStream(null);
        if (audioChunksRef.current.length === 0) {
          setIsListening(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        setIsTranscribing(true);
        try {
          const res = await transcribeAudio(audioBlob, 'unknown');
          if (res && res.transcript && res.transcript.trim()) {
            setSttDetectedLang({
              code: res.detectedLanguageCode ?? null,
              probability: res.languageProbability ?? null,
            });
            if (res.detectedLanguageCode) {
              updateDetectedLang(res.detectedLanguageCode, res.languageProbability);
            }
            setInput((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
          } else {
            setSpeechError(t('stt.error_unclear', "Sorry, I couldn't understand that. Please try again."));
          }
        } catch (err) {
          console.error('[stt-error]', err);
          setSpeechError(t('stt.error_unclear', "Sorry, I couldn't understand that. Please try again."));
        } finally {
          setIsTranscribing(false);
          setIsListening(false);
        }
      };

      mediaRecorder.start(100);
      setIsListening(true);
    } catch (err: unknown) {
      console.error('[mic-permission-error]', err);
      const eName = (err as { name?: string })?.name;
      if (eName === 'NotAllowedError' || eName === 'PermissionDeniedError') {
        setSpeechError('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        setSpeechError(t('stt.error_unclear', "Sorry, I couldn't understand that. Please try again."));
      }
      setActiveStream(null);
      setIsListening(false);
    }
  }, [language, t]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const onStepCompleteRef = useRef(onStepComplete);
  useEffect(() => {
    onStepCompleteRef.current = onStepComplete;
  }, [onStepComplete]);

  const lastSyncedMessagesRef = useRef<ChatMessage[] | null>(
    initialMessages && initialMessages.length > 0 ? initialMessages : null
  );

  // Reset chat on explicit New Chat action
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      chatIdRef.current = null;
      lastSyncedMessagesRef.current = null;
      setSessionId('');
      setMessages([]);
      setShowWelcome(true);
      setInput('');
      setLoading(false);
      setSpeechError(null);
      lastProcessedQueryRef.current = null;
      stopAudio();
      stopListening();
    }
  }, [resetKey, stopAudio, stopListening]);

  // Synchronize when switching to a different chat or loading initial messages
  useEffect(() => {
    if (propChatId && propChatId !== chatIdRef.current) {
      chatIdRef.current = propChatId;
      setSessionId(propChatId);
      stopAudio();
      stopListening();
    }

    if (
      initialMessages &&
      initialMessages.length > 0 &&
      initialMessages !== lastSyncedMessagesRef.current
    ) {
      lastSyncedMessagesRef.current = initialMessages;
      setMessages(
        initialMessages.map((m) => ({
          id: String(m.id),
          role: m.role,
          text: m.content,
          type: m.type as ChatResponse['type'],
          data: m.data || undefined,
          quickActions: m.quick_actions || undefined,
          disclaimer: m.disclaimer || undefined,
          speechText: (m.speechText || (m as any).speech_text || (m.data as any)?.speechText) as string | undefined,
        }))
      );
      setShowWelcome(false);

      const hasAssistant = initialMessages.some((m) => m.role === 'assistant');
      if (hasAssistant) onStepCompleteRef.current?.('eligibility');

      const hasEmi = initialMessages.some((m) => m.type === 'emi');
      if (hasEmi) {
        onStepCompleteRef.current?.('scheme');
        onStepCompleteRef.current?.('emi');
      }

      const hasPartner = initialMessages.some((m) => m.type === 'partners');
      if (hasPartner) {
        onStepCompleteRef.current?.('scheme');
        onStepCompleteRef.current?.('partner');
      }
    }
  }, [propChatId, initialMessages, stopAudio, stopListening]);

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random().toString(36).substring(2) },
    ]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      if (isListening) stopListening();

      setShowWelcome(false);
      addMessage({ role: 'user', text });
      setInput('');
      setLoading(true);

      try {
        const reqLang = isAuto ? 'auto' : language;
        const res = await sendChat(
          text,
          sessionId || undefined,
          chatIdRef.current || undefined,
          token,
          reqLang,
          sttDetectedLang.code,
          sttDetectedLang.probability,
          category || undefined
        );
        setSttDetectedLang({ code: null, probability: null });

        if (res.detectedLanguage) {
          updateDetectedLang(res.detectedLanguage);
        }

        const newChatId = res.chatId || res.sessionId;
        setSessionId(newChatId);
        if (!chatIdRef.current && res.chatId) {
          chatIdRef.current = res.chatId;
          onChatCreated?.(res.chatId);
        }

        onStepComplete?.('eligibility');

        if (res.type === 'emi' || res.data?.emi) {
          onStepComplete?.('scheme');
          onStepComplete?.('emi');
        } else if (res.type === 'partners' || res.data?.partners) {
          onStepComplete?.('scheme');
          onStepComplete?.('partner');
        }

        addMessage({
          role: 'assistant',
          text: res.message,
          type: res.type,
          data: res.data,
          quickActions: res.quickActions,
          disclaimer: res.disclaimer,
          speechText: res.speechText,
          animate: true,
        });
      } catch (err) {
        addMessage({
          role: 'assistant',
          text: t('chat.error_fallback', 'Unable to process your request right now. Please try again in a moment.'),
          animate: true,
        });
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, sessionId, token, onChatCreated, onStepComplete, addMessage, isListening, stopListening, language, isAuto, updateDetectedLang, category]
  );

  const handleSchemeAction = useCallback(
    async (action: 'KNOW_MORE' | 'DOCUMENTS' | 'EMI', scheme: Scheme) => {
      if (loading) return;
      if (isListening) stopListening();

      let actionLabel = '';
      if (action === 'KNOW_MORE') actionLabel = `Tell me more about ${scheme.name}`;
      else if (action === 'DOCUMENTS') actionLabel = `What documents are required for ${scheme.name}?`;
      else if (action === 'EMI') actionLabel = `Calculate EMI for ${scheme.name}`;

      setShowWelcome(false);
      addMessage({ role: 'user', text: actionLabel });
      setLoading(true);

      try {
        const reqLang = isAuto ? 'auto' : language;
        const res = await sendChat(
          actionLabel,
          sessionId || undefined,
          chatIdRef.current || undefined,
          token,
          reqLang,
          sttDetectedLang.code,
          sttDetectedLang.probability,
          category || undefined,
          {
            action,
            schemeId: scheme.id,
            schemeName: scheme.name,
          }
        );
        setSttDetectedLang({ code: null, probability: null });

        if (res.detectedLanguage) {
          updateDetectedLang(res.detectedLanguage);
        }

        const newChatId = res.chatId || res.sessionId;
        setSessionId(newChatId);
        if (!chatIdRef.current && res.chatId) {
          chatIdRef.current = res.chatId;
          onChatCreated?.(res.chatId);
        }

        onStepComplete?.('eligibility');
        if (action === 'EMI' || res.type === 'emi' || res.data?.emi) {
          onStepComplete?.('scheme');
          onStepComplete?.('emi');
        }

        addMessage({
          role: 'assistant',
          text: res.message,
          type: res.type,
          data: res.data,
          quickActions: res.quickActions,
          disclaimer: res.disclaimer,
          speechText: res.speechText,
          animate: true,
        });
      } catch (err) {
        addMessage({
          role: 'assistant',
          text: t('chat.error_fallback', 'Unable to process your request right now. Please try again in a moment.'),
          animate: true,
        });
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, isListening, stopListening, addMessage, isAuto, language, sessionId, token, sttDetectedLang.code, sttDetectedLang.probability, category, onChatCreated, onStepComplete, t, updateDetectedLang]
  );

  const handleCompareSchemes = useCallback(
    async (schemesToCompare: Scheme[]) => {
      if (loading) return;
      if (isListening) stopListening();

      const names = schemesToCompare.map((s) => s.name).join(', ');
      const ids = schemesToCompare.map((s) => s.id);
      const text = `Compare the schemes: ${names}`;

      setShowWelcome(false);
      addMessage({ role: 'user', text });
      setLoading(true);

      try {
        const reqLang = isAuto ? 'auto' : language;
        const res = await sendChat(
          text,
          sessionId || undefined,
          chatIdRef.current || undefined,
          token,
          reqLang,
          sttDetectedLang.code,
          sttDetectedLang.probability,
          category || undefined,
          {
            action: 'COMPARE',
            schemeIds: ids,
            schemeNames: schemesToCompare.map((s) => s.name),
          }
        );
        setSttDetectedLang({ code: null, probability: null });

        if (res.detectedLanguage) {
          updateDetectedLang(res.detectedLanguage);
        }

        const newChatId = res.chatId || res.sessionId;
        setSessionId(newChatId);
        if (!chatIdRef.current && res.chatId) {
          chatIdRef.current = res.chatId;
          onChatCreated?.(res.chatId);
        }

        onStepComplete?.('scheme');

        addMessage({
          role: 'assistant',
          text: res.message,
          type: res.type,
          data: res.data,
          quickActions: res.quickActions,
          disclaimer: res.disclaimer,
          speechText: res.speechText,
          animate: true,
        });
      } catch (err) {
        addMessage({
          role: 'assistant',
          text: t('chat.error_fallback', 'Unable to process your request right now. Please try again in a moment.'),
          animate: true,
        });
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, isListening, stopListening, addMessage, isAuto, language, sessionId, token, sttDetectedLang.code, sttDetectedLang.probability, category, onChatCreated, onStepComplete, t, updateDetectedLang]
  );

  const lastProcessedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && lastProcessedQueryRef.current !== initialQuery) {
      lastProcessedQueryRef.current = initialQuery;
      send(initialQuery);
    }
  }, [initialQuery, send]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const suggestionList = SUGGESTIONS[language] || SUGGESTIONS.en;
  const activeCategoryItem = category
    ? suggestionList.find((s) => s.id === category) || suggestionList[0]
    : null;

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

          {/* ── Category-Specific Page View Header ─────────────────────────────────── */}
          {showWelcome && messages.length === 0 && activeCategoryItem && (
            <div
              style={{
                width: '100%',
                padding: '12px 0 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <button
                onClick={() => router.push('/chat')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#0b1f3a',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: 'fit-content',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
                }}
              >
                <ArrowLeft size={16} color="#e87722" />
                <span>{t('chat.back_to_landing', '← Back to AI Assistant')}</span>
              </button>

              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 4px 16px rgba(11,31,58,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: activeCategoryItem.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(() => {
                      const ActiveIcon = activeCategoryItem.icon;
                      return <ActiveIcon size={20} color={activeCategoryItem.color} />;
                    })()}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    {activeCategoryItem.tag}
                  </span>
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.01em' }}>
                  {activeCategoryItem.title}
                </h1>

                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
                  {activeCategoryItem.desc}
                </p>

                <button
                  onClick={() => send(activeCategoryItem.query)}
                  style={{
                    marginTop: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: '#0b1f3a',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: 'fit-content',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                  }}
                >
                  <Sparkles size={16} color="#fbbf24" />
                  <span>{t('chat.start_this_query', 'Start inquiry with this template')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── AI Assistant Landing Page View ───────────────────────────────────────── */}
          {showWelcome && messages.length === 0 && !activeCategoryItem && (
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 58,
                    height: 62,
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    boxShadow: '0 4px 14px rgba(0, 30, 64, 0.08)',
                  }}
                >
                  <EmblemOfIndia size={48} />
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef3f9', padding: '5px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#001e40', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    National SC Finance & Development Corporation (NSFDC)
                  </span>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#001e40', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
                  {t('chat.welcome_title', 'NSFDC Scheme & Concessional Loan Advisory')}
                </h1>

                <p style={{ fontSize: 14.5, color: '#475569', maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                  {t('chat.welcome_desc', 'Official consultation service for Scheduled Caste entrepreneurs, students, and self-help groups. Provide your project trade, income profile, or loan requirement to receive eligible program rankings and exact subsidized repayment plans.')}
                </p>
              </div>

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
                      onClick={() => router.push(`/chat?category=${item.id}`)}
                      className="chat-suggestion-card interactive-control focus-ring"
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
                        transition: 'transform 180ms var(--ease-out), border-color 150ms ease, box-shadow 180ms var(--ease-out)',
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

          <div style={{ width: '100%' }}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onAction={send}
                onSchemeAction={handleSchemeAction}
                onCompareSchemes={handleCompareSchemes}
                onOpenPartners={() => router.push('/partners')}
                onOpenEMI={(schemeId) => router.push(`/chat?tab=emi${schemeId ? `&schemeId=${schemeId}` : ''}`)}
                onStepComplete={onStepComplete}
                scrollRef={bottomRef}
                playingVoiceId={playingVoiceId}
                loadingVoiceId={loadingVoiceId}
                onPlayVoice={handlePlayVoice}
                onStopVoice={stopAudio}
                t={t}
              />
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
            className="chat-composer"
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 18,
              padding: '8px 12px 8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms var(--ease-out)',
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
                isListening
                  ? t('chat.listening', 'Listening...')
                  : activeCategoryItem
                  ? `${t('chat.ask_about', 'Ask a question about')} ${activeCategoryItem.title}...`
                  : t('chat.input_ph', 'Ask about loans, eligibility, interest rates, or channel partners...')
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

            {speechSupported && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isListening && <VoiceVisualizer stream={activeStream} isListening={isListening} />}
                <button
                  onClick={toggleListening}
                  disabled={loading || isTranscribing}
                  title={
                    isTranscribing
                      ? 'Processing voice input...'
                      : isListening
                      ? 'Stop listening'
                      : 'Speak your message'
                  }
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: isListening ? '#dc2626' : '#e2e8f0',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: loading || isTranscribing ? 'default' : 'pointer',
                    opacity: loading || isTranscribing ? 0.6 : 1,
                    transition: 'background-color 180ms ease, opacity 150ms ease, transform 180ms var(--ease-out)',
                  }}
                >
                  {isTranscribing ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} color="#0b1f3a" />
                  ) : isListening ? (
                    <MicOff size={18} color="#ffffff" />
                  ) : (
                    <Mic size={18} color="#0b1f3a" />
                  )}
                </button>
              </div>
            )}

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
                transition: 'background-color 180ms ease, opacity 150ms ease, transform 180ms var(--ease-out)',
              }}
              title="Send message (Enter)"
            >
              <Send size={17} color={input.trim() && !loading ? '#fbbf24' : '#ffffff'} />
            </button>
          </div>

          {isTranscribing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', fontSize: 11.5, color: '#0b1f3a' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} color="#0b1f3a" />
              <span style={{ fontWeight: 600 }}>{t('chat.transcribing', 'Processing voice input with Sarvam AI...')}</span>
            </div>
          )}

          {isListening && !isTranscribing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', fontSize: 11.5, color: '#0b1f3a' }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#dc2626', opacity: 0.6, animation: 'pulse 1.5s infinite' }} />
                <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
              </span>
              <span style={{ fontWeight: 600 }}>{t('chat.listening_instructions', 'Listening — speak now, click mic again when done')}</span>
            </div>
          )}

          {speechError && (
            <div style={{ padding: '0 4px', fontSize: 11.5, color: '#dc2626' }}>
              {speechError}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: 11.5, color: '#94a3b8' }}>
            <span>{t('chat.press_enter', 'Press Enter ↵ to send')}</span>
            <span>{t('chat.verified_data', 'Verified against official NSFDC scheme catalog data')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
