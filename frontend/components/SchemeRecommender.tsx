// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import SchemeCard from './SchemeCard';
import { recommendSchemes, chatRecommend } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Scheme {
  id: number;
  name: string;
  category: string;
  description: string;
  max_income_lakh: number;
  min_loan_lakh: number;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  coverage_percent: number;
  eligible_project_types: string[];
  notes: string;
}

interface Props {
  onSchemeSelected: (scheme: object) => void;
}

const STARTER_PROMPTS = [
  'I want to start a small tailoring shop. Family earns about ₹2.5 lakh a year.',
  'मैं एक छोटी किराना दुकान खोलना चाहता हूँ। परिवार की आय लगभग ₹3 लाख है।',
  'I need an education loan for my engineering degree.',
  'I want to buy a tractor for farming. My annual income is ₹4 lakh.',
];

export default function SchemeRecommender({ onSchemeSelected }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    setHasStarted(true);
    setLoading(true);
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);

    try {
      if (schemes.length === 0) {
        // First message — run the full recommender pipeline
        const data = await recommendSchemes(text, messages);
        setSchemes(data.schemes || []);
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.aiAnalysis || 'Here are the schemes that match your needs.' },
        ]);
      } else {
        // Follow-up — grounded chat
        const data = await chatRecommend(text, schemes, newMessages);
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    onSchemeSelected(scheme);
  };

  return (
    <div className="flex flex-col gap-4">
      {!hasStarted && (
        <div className="text-center py-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent-light)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Find the right scheme for you
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Describe your project, income, and needs in any language — Hindi, English, or your regional language.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-left text-sm px-4 py-3 rounded-xl border transition-colors hover:border-blue-400"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-3 min-h-[200px]">
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                Analyzing your needs…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {schemes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>
            MATCHING SCHEMES — select one to use in EMI Calculator & Partner Locator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onSelect={handleSchemeSelect}
                selected={selectedScheme?.id === scheme.id}
              />
            ))}
          </div>
        </div>
      )}

      {hasStarted && (
        <ChatInput
          onSend={sendMessage}
          placeholder={schemes.length > 0 ? 'Ask a follow-up question about these schemes…' : 'Describe your project and income…'}
          disabled={loading}
        />
      )}

      {!hasStarted && (
        <ChatInput
          onSend={sendMessage}
          placeholder="Describe your project, income, and needs in any language…"
          disabled={loading}
        />
      )}
    </div>
  );
}
