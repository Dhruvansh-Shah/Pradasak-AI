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

export type VoiceAgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'ERROR'
  | 'ENDED';

function AudioWaveformIcon({ state }: { state: VoiceAgentState }) {
  const bars = [
    { idleH: 8, delay: '0ms' },
    { idleH: 15, delay: '120ms' },
    { idleH: 22, delay: '240ms' },
    { idleH: 14, delay: '360ms' },
    { idleH: 7, delay: '480ms' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3.5,
        height: 26,
        width: 30,
      }}
      aria-hidden="true"
    >
      {bars.map((bar, i) => {
        let animation = 'none';
        if (state === 'LISTENING') {
          animation = `waveBarListening 1s ease-in-out infinite ${bar.delay}`;
        } else if (state === 'PROCESSING') {
          animation = `waveBarProcessing 1.4s ease-in-out infinite ${bar.delay}`;
        } else if (state === 'SPEAKING') {
          animation = `waveBarSpeaking 0.85s ease-in-out infinite ${bar.delay}`;
        }

        return (
          <span
            key={i}
            className="audio-wave-bar"
            style={{
              display: 'block',
              width: 3,
              height:
                state === 'IDLE' || state === 'ENDED' || state === 'ERROR'
                  ? bar.idleH
                  : undefined,
              background: '#ffffff',
              borderRadius: 2.5,
              animation,
              transition: 'height 180ms ease, opacity 180ms ease',
            }}
          />
        );
      })}
    </div>
  );
}

function renderSlidingLetters(
  text: string,
  phase: 'IN' | 'OUT',
  delayPerLetter: number,
  lang: string = 'en'
) {
  let letters: string[] = [];
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(lang, { granularity: 'grapheme' });
      letters = Array.from(segmenter.segment(text), (s) => s.segment);
    } else {
      letters = Array.from(text);
    }
  } catch {
    letters = Array.from(text);
  }

  // Group by words so line wrapping only happens on whitespace boundaries
  const words: { wordLetters: { char: string; index: number }[]; isSpaceAfter: boolean }[] = [];
  let currentWord: { char: string; index: number }[] = [];
  let globalIndex = 0;

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (char === ' ') {
      if (currentWord.length > 0) {
        words.push({ wordLetters: currentWord, isSpaceAfter: true });
        currentWord = [];
      } else if (words.length > 0) {
        words[words.length - 1].isSpaceAfter = true;
      }
      globalIndex++;
    } else {
      currentWord.push({ char, index: globalIndex });
      globalIndex++;
    }
  }
  if (currentWord.length > 0) {
    words.push({ wordLetters: currentWord, isSpaceAfter: false });
  }

  const animClass = phase === 'IN' ? 'letter-slide-in' : 'letter-slide-out';

  return (
    <>
      {words.map((w, wIdx) => (
        <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {w.wordLetters.map(({ char, index }) => (
            <span
              key={index}
              className={animClass}
              style={{
                display: 'inline-block',
                animationDelay: phase === 'IN' ? `${index * delayPerLetter}ms` : `${index * 12}ms`,
              }}
            >
              {char}
            </span>
          ))}
          {w.isSpaceAfter && (
            <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>
          )}
        </span>
      ))}
    </>
  );
}

function SequentialWelcome({
  onComplete,
  t,
}: {
  onComplete: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'DONE'>(1);
  const [phase, setPhase] = useState<'IN' | 'OUT'>('IN');

  const step1Text = 'नमस्ते!';
  const step2Text = t('chat.welcome_step2', 'Welcome to PradarshakAI');
  const step3Text = t(
    'chat.welcome_step3',
    'Tap the blue audio button to start a voice conversation.'
  );
  const step4Text = t(
    'chat.welcome_step4',
    'Prefer typing? Enter your question below - or use the mic in the chat box to speak your question.'
  );

  useEffect(() => {
    let isMounted = true;
    const timers: NodeJS.Timeout[] = [];

    // Step 1 ("नमस्ते!"): slower letter-by-letter flow
    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setPhase('OUT');
      }, 2800)
    );

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setStep(2);
        setPhase('IN');
      }, 2800 + 480 + 140) // 3420ms
    );

    // Step 2 ("Welcome to PradarshakAI"): ~23 letters
    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setPhase('OUT');
      }, 3420 + 3400) // 6820ms
    );

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setStep(3);
        setPhase('IN');
      }, 6820 + 480 + 140) // 7440ms
    );

    // Step 3 (Voice instruction): ~60 letters
    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setPhase('OUT');
      }, 7440 + 3800) // 11240ms
    );

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setStep(4);
        setPhase('IN');
      }, 11240 + 480 + 140) // 11860ms
    );

    // Step 4 (Typing instruction): ~95 letters
    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setPhase('OUT');
      }, 11860 + 4400) // 16260ms
    );

    timers.push(
      setTimeout(() => {
        if (!isMounted) return;
        setStep('DONE');
        onComplete();
      }, 16260 + 480) // 16740ms
    );

    return () => {
      isMounted = false;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [onComplete]);

  if (step === 'DONE') return null;

  return (
    <div
      style={{
        width: '100%',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px 16px',
        overflow: 'hidden',
      }}
    >
      {/* STEP 1: HINDI NAMASTE (Letter by letter from left to right) */}
      {step === 1 && (
        <h1
          key="step1"
          style={{
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            fontWeight: 800,
            color: '#001e40',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            margin: 0,
            maxWidth: 720,
          }}
        >
          {renderSlidingLetters(step1Text, phase, 140, 'hi')}
        </h1>
      )}

      {/* STEP 2: WELCOME TO PRADARSHAKAI (Letter by letter from left to right) */}
      {step === 2 && (
        <h1
          key="step2"
          style={{
            fontSize: 'clamp(26px, 3.8vw, 38px)',
            fontWeight: 800,
            color: '#001e40',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            margin: 0,
            maxWidth: 720,
          }}
        >
          {renderSlidingLetters(step2Text, phase, 42, 'en')}
        </h1>
      )}

      {/* STEP 3: VOICE INSTRUCTION (Letter by letter from left to right) */}
      {step === 3 && (
        <p
          key="step3"
          style={{
            fontSize: 'clamp(17px, 2.4vw, 20.5px)',
            fontWeight: 600,
            color: '#000000',
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 680,
          }}
        >
          {renderSlidingLetters(step3Text, phase, 24, 'en')}
        </p>
      )}

      {/* STEP 4: TEXT / DICTATION INSTRUCTION (Letter by letter from left to right) */}
      {step === 4 && (
        <p
          key="step4"
          style={{
            fontSize: 'clamp(17px, 2.4vw, 20.5px)',
            fontWeight: 600,
            color: '#000000',
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 680,
          }}
        >
          {renderSlidingLetters(step4Text, phase, 18, 'en')}
        </p>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  chatId?: string | null;
  resetKey?: number;
  token?: string | null;
  onChatCreated?: (chatId: string) => void;
  onStepComplete?: (stepKey: 'eligibility' | 'scheme' | 'emi' | 'partner') => void;
  onMessagesChange?: (messages: Message[], currentChatId: string | null) => void;
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
  onMessagesChange,
  initialMessages,
  initialQuery,
  category,
}: ChatInterfaceProps) {
  const router = useRouter();
  // Always initialise with empty array on SSR; hydrate from sessionStorage in useEffect.
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
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
    }
    return [];
  });
  const [_hydratedFromSession, _setHydratedFromSession] = useState(false);

  const { lang: language, isAuto, updateDetectedLang, setLang: setLanguage, t } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // sessionId and showWelcome: initialise safely without sessionStorage (SSR-safe).
  const [sessionId, setSessionId] = useState<string>(() => propChatId || '');
  const [showWelcome, setShowWelcome] = useState(() => {
    if (initialMessages && initialMessages.length > 0) return false;
    return true;
  });
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(!showWelcome || !!initialMessages?.length);
  const [playAttentionPop, setPlayAttentionPop] = useState(false);
  const prevWelcomeCompleteRef = useRef(isWelcomeComplete);
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

  // Flow B: Large Blue Audio Waveform Button (Continuous Voice-to-Voice Agent)
  const [voiceAgentState, setVoiceAgentState] = useState<VoiceAgentState>('IDLE');

  const isBottomDocked =
    messages.some((m) => m.role === 'assistant') ||
    loading ||
    voiceAgentState === 'PROCESSING' ||
    voiceAgentState === 'SPEAKING' ||
    (messages.length > 0 && !showWelcome);

  // Trigger attention scale pop shortly after the chatbox begins its smooth slide up
  useEffect(() => {
    if (!prevWelcomeCompleteRef.current && isWelcomeComplete && !isBottomDocked) {
      const timer = setTimeout(() => {
        setPlayAttentionPop(true);
      }, 700);
      return () => clearTimeout(timer);
    }
    prevWelcomeCompleteRef.current = isWelcomeComplete;
  }, [isWelcomeComplete, isBottomDocked]);
  const isVoiceSessionActiveRef = useRef(false);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);

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
      const targetLang = langMap[lang] || 'en-IN';
      utterance.lang = targetLang;

      // Select matching voice from browser if available
      const voices = window.speechSynthesis.getVoices?.() || [];
      if (voices.length > 0) {
        const exactVoice = voices.find((v) => v.lang && v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase());
        const prefixVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase()));
        const indianVoice = voices.find((v) => v.lang && (v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india')));
        if (exactVoice) {
          utterance.voice = exactVoice;
        } else if (prefixVoice) {
          utterance.voice = prefixVoice;
        } else if (indianVoice) {
          utterance.voice = indianVoice;
        }
      }

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

  // ── Hydrate messages and sessionId from sessionStorage after mount (client-only) ──
  useEffect(() => {
    if (_hydratedFromSession) return;
    if (initialMessages && initialMessages.length > 0) {
      _setHydratedFromSession(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem('pradarshak_active_chat');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setShowWelcome(false);
          setIsWelcomeComplete(true);
        }
        if (parsed.chatId && !propChatId) {
          setSessionId(parsed.chatId);
        }
      }
    } catch { }
    _setHydratedFromSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Translate all existing chat messages when the selected language changes ──
  useEffect(() => {
    if (!_hydratedFromSession) return; // wait until we have real messages
    if (messages.length === 0) return;

    const langMap: Record<string, string> = {
      hi: 'hi', mr: 'mr', bn: 'bn', gu: 'gu', kn: 'kn',
      ml: 'ml', od: 'or', pa: 'pa', ta: 'ta', te: 'te', en: 'en',
    };
    const targetLang = langMap[language] || 'en';
    if (targetLang === 'en' && language === 'en') return; // nothing to do for default

    let cancelled = false;

    async function translateText(text: string): Promise<string> {
      if (!text || !text.trim()) return text;
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const json = await res.json();
        // Response is nested array: [[['translated','original',...],...],...]  
        const translated: string = (json[0] as any[])
          .map((chunk: any[]) => (chunk[0] as string) || '')
          .join('');
        return translated || text;
      } catch {
        return text;
      }
    }

    async function translateAll() {
      const translated = await Promise.all(
        messages.map(async (msg) => {
          const newText = await translateText(msg.text);
          return { ...msg, text: newText, animate: false };
        })
      );
      if (!cancelled) setMessages(translated);
    }

    translateAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, _hydratedFromSession]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(propChatId || null);

  useEffect(() => {
    chatIdRef.current = propChatId || null;
  }, [propChatId]);

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

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random().toString(36).substring(2) },
    ]);
  }, []);

  const cleanupVoiceAgent = useCallback(() => {
    isVoiceSessionActiveRef.current = false;
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      try {
        voiceRecorderRef.current.stop();
      } catch { }
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceStreamRef.current = null;
    }
    if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
      try {
        voiceAudioCtxRef.current.close();
      } catch { }
      voiceAudioCtxRef.current = null;
    }
    stopAudio();
  }, [stopAudio]);

  const startVoiceAgentTurn = useCallback(async () => {
    if (!isVoiceSessionActiveRef.current) return;
    setSpeechError(null);

    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setVoiceAgentState('ERROR');
      setSpeechError('Microphone recording is not supported by your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isVoiceSessionActiveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      voiceRecorderRef.current = recorder;

      let animFrameId: number | null = null;
      let hasSpoken = false;
      let silenceStart: number | null = null;
      let sourceNode: MediaStreamAudioSourceNode | null = null;
      let analyser: AnalyserNode | null = null;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          voiceAudioCtxRef.current = audioCtx;
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          sourceNode = audioCtx.createMediaStreamSource(stream);
          sourceNode.connect(analyser);

          const dataArr = new Uint8Array(analyser.frequencyBinCount);

          const checkAudio = () => {
            if (!isVoiceSessionActiveRef.current || recorder.state === 'inactive') return;
            analyser?.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
            const avg = sum / dataArr.length;

            const now = Date.now();
            if (avg > 14) {
              hasSpoken = true;
              silenceStart = null;
            } else if (hasSpoken) {
              if (!silenceStart) {
                silenceStart = now;
              } else if (now - silenceStart > 1650) {
                if (recorder.state === 'recording') {
                  recorder.stop();
                  return;
                }
              }
            }
            animFrameId = requestAnimationFrame(checkAudio);
          };
          animFrameId = requestAnimationFrame(checkAudio);
        }
      } catch (e) {
        console.warn('AudioContext VAD unavailable:', e);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        try {
          sourceNode?.disconnect();
          analyser?.disconnect();
          if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
            voiceAudioCtxRef.current.close();
            voiceAudioCtxRef.current = null;
          }
        } catch { }

        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((track) => track.stop());
          voiceStreamRef.current = null;
        }

        if (!isVoiceSessionActiveRef.current) {
          setVoiceAgentState('IDLE');
          return;
        }

        if (voiceChunksRef.current.length === 0) {
          if (isVoiceSessionActiveRef.current) {
            startVoiceAgentTurn();
          }
          return;
        }

        const audioBlob = new Blob(voiceChunksRef.current, { type: mimeType });
        voiceChunksRef.current = [];

        setVoiceAgentState('PROCESSING');
        setShowWelcome(false);

        try {
          const sttRes = await transcribeAudio(audioBlob, 'unknown');
          if (!isVoiceSessionActiveRef.current) {
            setVoiceAgentState('IDLE');
            return;
          }

          const transcript = sttRes?.transcript?.trim();
          if (transcript) {
            addMessage({ role: 'user', text: transcript });
            if (sttRes.detectedLanguageCode) {
              updateDetectedLang(sttRes.detectedLanguageCode, sttRes.languageProbability);
            }

            const reqLang = isAuto ? 'auto' : language;
            const chatRes = await sendChat(
              transcript,
              sessionId || undefined,
              chatIdRef.current || undefined,
              token,
              reqLang,
              sttRes.detectedLanguageCode,
              sttRes.languageProbability,
              category || undefined
            );

            if (!isVoiceSessionActiveRef.current) {
              setVoiceAgentState('IDLE');
              return;
            }

            if (chatRes.detectedLanguage) {
              updateDetectedLang(chatRes.detectedLanguage);
            }

            const newCId = chatRes.chatId || chatRes.sessionId;
            setSessionId(newCId);
            if (!chatIdRef.current && chatRes.chatId) {
              chatIdRef.current = chatRes.chatId;
              onChatCreated?.(chatRes.chatId);
            }

            onStepComplete?.('eligibility');
            if (chatRes.type === 'emi' || chatRes.data?.emi) {
              onStepComplete?.('scheme');
              onStepComplete?.('emi');
            } else if (chatRes.type === 'partners' || chatRes.data?.partners) {
              onStepComplete?.('scheme');
              onStepComplete?.('partner');
            }

            const assistantMsgId = Date.now().toString() + Math.random().toString(36).substring(2);
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMsgId,
                role: 'assistant',
                text: chatRes.message,
                type: chatRes.type,
                data: chatRes.data,
                quickActions: chatRes.quickActions,
                disclaimer: chatRes.disclaimer,
                speechText: chatRes.speechText,
                animate: true,
              },
            ]);

            const speechToSay = chatRes.speechText || chatRes.message;
            const cleanSpeech = speechToSay.replace(/[#*`_\[\]]/g, '').trim();

            setVoiceAgentState('SPEAKING');

            try {
              const ttsBlob = await fetchTTS(cleanSpeech, language);
              if (!isVoiceSessionActiveRef.current) {
                setVoiceAgentState('IDLE');
                return;
              }

              const url = URL.createObjectURL(ttsBlob);
              audioUrlRef.current = url;
              const audio = new Audio(url);
              audioRef.current = audio;

              audio.onended = () => {
                stopAudio();
                if (isVoiceSessionActiveRef.current) {
                  startVoiceAgentTurn();
                } else {
                  setVoiceAgentState('IDLE');
                }
              };

              audio.onerror = () => {
                stopAudio();
                if (isVoiceSessionActiveRef.current) {
                  fallbackBrowserSpeech(cleanSpeech, language, assistantMsgId);
                  setTimeout(() => {
                    if (isVoiceSessionActiveRef.current) startVoiceAgentTurn();
                  }, 3000);
                }
              };

              await audio.play();
            } catch (ttsErr) {
              console.warn('TTS error, falling back to browser synthesis:', ttsErr);
              if (isVoiceSessionActiveRef.current) {
                fallbackBrowserSpeech(cleanSpeech, language, assistantMsgId);
                setTimeout(() => {
                  if (isVoiceSessionActiveRef.current) startVoiceAgentTurn();
                }, 3500);
              }
            }
          } else {
            if (isVoiceSessionActiveRef.current) {
              startVoiceAgentTurn();
            } else {
              setVoiceAgentState('IDLE');
            }
          }
        } catch (err) {
          console.error('Voice turn processing error:', err);
          if (isVoiceSessionActiveRef.current) {
            startVoiceAgentTurn();
          } else {
            setVoiceAgentState('ERROR');
          }
        }
      };

      recorder.start(100);
      setVoiceAgentState('LISTENING');
    } catch (err: unknown) {
      console.error('Microphone access error:', err);
      const eName = (err as { name?: string })?.name;
      if (eName === 'NotAllowedError' || eName === 'PermissionDeniedError') {
        setSpeechError('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        setSpeechError(t('stt.error_unclear', "Sorry, I couldn't understand that. Please try again."));
      }
      setVoiceAgentState('ERROR');
    }
  }, [
    isAuto,
    language,
    sessionId,
    token,
    category,
    onChatCreated,
    onStepComplete,
    addMessage,
    stopAudio,
    fallbackBrowserSpeech,
    t,
    updateDetectedLang,
  ]);

  const handleToggleVoiceAgent = useCallback(() => {
    if (voiceAgentState === 'SPEAKING') {
      stopAudio();
      setVoiceAgentState('INTERRUPTED');
      setTimeout(() => {
        if (isVoiceSessionActiveRef.current) {
          startVoiceAgentTurn();
        }
      }, 150);
      return;
    }

    if (voiceAgentState === 'LISTENING' || voiceAgentState === 'PROCESSING') {
      cleanupVoiceAgent();
      setVoiceAgentState('ENDED');
      setTimeout(() => setVoiceAgentState('IDLE'), 500);
      return;
    }

    setIsWelcomeComplete(true);
    if (isListening) {
      stopListening();
    }
    isVoiceSessionActiveRef.current = true;
    startVoiceAgentTurn();
  }, [voiceAgentState, stopAudio, startVoiceAgentTurn, cleanupVoiceAgent, isListening, stopListening]);

  const toggleListening = () => {
    setIsWelcomeComplete(true);
    if (isListening) {
      stopListening();
    } else {
      if (isVoiceSessionActiveRef.current) {
        cleanupVoiceAgent();
        setVoiceAgentState('IDLE');
      }
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      cleanupVoiceAgent();
    };
  }, [cleanupVoiceAgent]);

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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pradarshak_active_chat');
      }
      chatIdRef.current = null;
      lastSyncedMessagesRef.current = null;
      setSessionId('');
      setMessages([]);
      setShowWelcome(true);
      setIsWelcomeComplete(false);
      setInput('');
      setLoading(false);
      setSpeechError(null);
      lastProcessedQueryRef.current = null;
      stopAudio();
      stopListening();
      cleanupVoiceAgent();
      setVoiceAgentState('IDLE');
    }
  }, [resetKey, stopAudio, stopListening, cleanupVoiceAgent]);

  // Synchronize messages state with parent and sessionStorage for session retention
  useEffect(() => {
    onMessagesChange?.(messages, propChatId || sessionId || null);
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        let existing: Record<string, unknown> = {};
        const raw = sessionStorage.getItem('pradarshak_active_chat');
        if (raw) existing = JSON.parse(raw);

        sessionStorage.setItem(
          'pradarshak_active_chat',
          JSON.stringify({
            ...existing,
            clientChatId: existing.clientChatId || ('guest-' + Date.now().toString(36)),
            chatId: propChatId || sessionId || existing.chatId || null,
            messages,
            persistedToDb: Boolean(token && (propChatId || existing.persistedToDb)),
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Failed to save chat to sessionStorage:', err);
      }
    }
  }, [messages, sessionId, propChatId, token, onMessagesChange]);

  // Synchronize when switching to a different chat or loading initial messages
  useEffect(() => {
    if (propChatId && propChatId !== chatIdRef.current) {
      chatIdRef.current = propChatId;
      setSessionId(propChatId);
      stopAudio();
      stopListening();
      cleanupVoiceAgent();
      setVoiceAgentState('IDLE');
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
      setIsWelcomeComplete(true);

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
  }, [propChatId, initialMessages, stopAudio, stopListening, cleanupVoiceAgent]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      if (isListening) stopListening();

      setShowWelcome(false);
      setIsWelcomeComplete(true);
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
      setIsWelcomeComplete(true);
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
      setIsWelcomeComplete(true);
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

          {/* ── Conversational Welcome Screen (Sequential Slide-Style Intro) ── */}
          {showWelcome && messages.length === 0 && !activeCategoryItem && !isWelcomeComplete && (
            <div
              style={{
                width: '100%',
                minHeight: '35vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SequentialWelcome
                key={`welcome-${resetKey}`}
                onComplete={() => setIsWelcomeComplete(true)}
                t={t}
              />
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

      {/* ── Docked Bottom / Ready Centered Input Area with Large Blue Audio Waveform Button ────── */}
      <div
        className="chat-controls-container"
        style={{
          borderTop: isBottomDocked ? '1px solid #e2e8f0' : '1px solid transparent',
          background: isBottomDocked ? '#ffffff' : 'transparent',
          padding: '14px 20px 20px',
          flexShrink: 0,
          boxShadow: isBottomDocked ? '0 -4px 20px rgba(0,0,0,0.03)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          zIndex: 10,
          transform: isBottomDocked
            ? 'translateY(0)'
            : isWelcomeComplete
              ? 'translateY(calc(-44dvh + 50%))'
              : 'translateY(0)',
          transition:
            isWelcomeComplete && !isBottomDocked
              ? 'transform 1000ms cubic-bezier(0.22, 1, 0.36, 1), background-color 350ms ease, border-color 350ms ease, box-shadow 350ms ease'
              : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1), background-color 350ms ease, border-color 350ms ease, box-shadow 350ms ease',
        }}
      >
        <div style={{ maxWidth: 880, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          {/* ── Active Live Voice-to-Voice Agent Panel (Shown ABOVE Chatbox when clicked/active) ── */}
          {voiceAgentState !== 'IDLE' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                animation: 'fadeIn 200ms ease-in-out',
              }}
            >
              <button
                type="button"
                onClick={handleToggleVoiceAgent}
                className={`interactive-control focus-ring ${voiceAgentState === 'LISTENING' ? 'audio-btn-listening' : ''}`}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background:
                    voiceAgentState === 'LISTENING'
                      ? 'linear-gradient(135deg, #0284c7, #0056b3)'
                      : voiceAgentState === 'SPEAKING'
                        ? 'linear-gradient(135deg, #0056b3, #0b1f3a)'
                        : voiceAgentState === 'PROCESSING'
                          ? '#1e3a5f'
                          : voiceAgentState === 'ERROR'
                            ? '#dc2626'
                            : 'linear-gradient(135deg, #0056b3, #003366)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow:
                    voiceAgentState === 'LISTENING'
                      ? '0 4px 18px rgba(2, 132, 199, 0.42)'
                      : '0 3px 12px rgba(0, 86, 179, 0.22)',
                  transition: 'all 200ms ease',
                  position: 'relative',
                }}
                title={
                  voiceAgentState === 'LISTENING'
                    ? t('voice.listening_title', 'Listening... Tap to finish turn or end session')
                    : voiceAgentState === 'SPEAKING'
                      ? t('voice.speaking', 'PradarshakAI speaking... Tap to interrupt')
                      : voiceAgentState === 'PROCESSING'
                        ? t('voice.thinking', 'Thinking...')
                        : t('voice.tap_to_start', 'Tap to start voice conversation with PradarshakAI')
                }
                aria-label={t('voice.aria_label', 'Voice conversation with PradarshakAI')}
              >
                <AudioWaveformIcon state={voiceAgentState} />
              </button>

              {/* Voice Status Sub-label */}
              <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                {voiceAgentState === 'LISTENING' ? (
                  <span style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7', animation: 'pulse 1.5s infinite' }} />
                    {t('voice.listening_hint', 'Listening — speak naturally (tap to pause/end)')}
                  </span>
                ) : voiceAgentState === 'PROCESSING' ? (
                  <span style={{ color: '#1e3a5f', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    {t('voice.thinking', 'Thinking...')}
                  </span>
                ) : voiceAgentState === 'SPEAKING' ? (
                  <span style={{ color: '#0056b3', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Volume2 size={13} />
                    {t('voice.speaking_status', 'PradarshakAI speaking (tap to interrupt)')}
                  </span>
                ) : voiceAgentState === 'ERROR' ? (
                  <span style={{ color: '#dc2626' }}>{t('voice.error_mic', 'Microphone access required. Tap to retry.')}</span>
                ) : (
                  <span style={{ color: '#475569' }}>{t('voice.talk_to_pradarshak', 'Talk to PradarshakAI')}</span>
                )}
              </div>
            </div>
          )}

          {/* ── Chatbox Row (Chat Composer + Idle Voice Button on the Right Level) ── */}
          <div
            className={`chatbox-row ${playAttentionPop ? 'chatbox-attention-pop' : ''}`}
            onAnimationEnd={() => setPlayAttentionPop(false)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, transformOrigin: 'center center' }}
          >
            {/* ── Chat Composer (Flow A: Text chat with speech-to-text dictation mic) ── */}
            <div
              className="chat-composer"
              style={{
                flex: 1,
                minWidth: 0,
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 18,
                padding: '8px 12px 8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms var(--ease-out)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#0b1f3a';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(11,31,58,0.08)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (!isWelcomeComplete) {
                    setIsWelcomeComplete(true);
                  }
                }}
                onFocus={() => {
                  setPlayAttentionPop(false);
                  if (!isWelcomeComplete) {
                    setIsWelcomeComplete(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? t('chat.listening', 'Listening for text input...')
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
                disabled={loading || voiceAgentState === 'PROCESSING'}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />

              {/* Preserved small composer mic for Speech-to-Text */}
              {speechSupported && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isListening && <VoiceVisualizer stream={activeStream} isListening={isListening} />}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={loading || isTranscribing || voiceAgentState === 'LISTENING' || voiceAgentState === 'PROCESSING'}
                    title={
                      isTranscribing
                        ? 'Processing voice-to-text...'
                        : isListening
                          ? 'Stop speech-to-text'
                          : 'Speak into chat box (Speech-to-Text)'
                    }
                    style={{
                      width: 40,
                      height: 40,
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
                    aria-label="Speech to text input"
                  >
                    {isTranscribing ? (
                      <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} color="#0b1f3a" />
                    ) : isListening ? (
                      <MicOff size={17} color="#ffffff" />
                    ) : (
                      <Mic size={17} color="#0b1f3a" />
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 40,
                  height: 40,
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
                aria-label="Send message"
              >
                <Send size={16} color={input.trim() && !loading ? '#fbbf24' : '#ffffff'} />
              </button>
            </div>

            {/* ── Voice-to-Voice Button & Text on the Right Level of Chatbox (When IDLE) ── */}
            {voiceAgentState === 'IDLE' && (
              <button
                type="button"
                onClick={handleToggleVoiceAgent}
                className="interactive-control focus-ring voice-idle-widget"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 18,
                  padding: '8px 16px 8px 10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 200ms ease',
                }}
                title={t('voice.tap_to_start', 'Tap to start voice conversation with PradarshakAI')}
                aria-label={t('voice.aria_label', 'Voice conversation with PradarshakAI')}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#0056b3';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 86, 179, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0056b3, #003366)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 86, 179, 0.25)',
                  }}
                >
                  <AudioWaveformIcon state="IDLE" />
                </div>
                <span className="voice-idle-text" style={{ fontSize: 13.5, fontWeight: 700, color: '#0b1f3a', whiteSpace: 'nowrap' }}>
                  {t('voice.talk_to_pradarshak', 'Talk to PradarshakAI')}
                </span>
              </button>
            )}
          </div>

          {isTranscribing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', fontSize: 11.5, color: '#0b1f3a' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} color="#0b1f3a" />
              <span style={{ fontWeight: 600 }}>{t('chat.transcribing', 'Converting speech to text...')}</span>
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
        </div>
      </div>
    </div>
  );
}
