// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { Calculator, TrendingDown } from 'lucide-react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { emiChat } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EmiResult {
  emi: number;
  totalPayable: number;
  totalInterest: number;
  params: { principal: number; annualRatePercent: number; tenureMonths: number; moratoriumMonths: number };
  schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[];
  explanation: string;
}

interface Props {
  selectedScheme: object | null;
}

export default function EmiCalculator({ selectedScheme }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<EmiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);

    try {
      const data = await emiChat(text, newMessages, selectedScheme || undefined);

      if (data.ready) {
        setResult(data);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `Your monthly EMI would be ₹${data.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.\n\nTotal amount payable: ₹${data.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\nTotal interest: ₹${data.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n\n${data.explanation || ''}`,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.question || 'Could you provide more details?' },
        ]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="text-center py-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#fef3c7' }}
          >
            <Calculator className="w-7 h-7" style={{ color: '#d97706' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Calculate your EMI
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            Tell me your loan amount, preferred tenure, and monthly budget — I'll help you find the right repayment plan.
          </p>
          {selectedScheme && (
            <p className="text-xs px-3 py-1.5 rounded-full inline-block" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              Using rates from your selected scheme
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              Calculating…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {result && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Amortization Preview</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--accent-light)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Monthly EMI</p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                ₹{result.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: '#f0fdf4' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Total Payable</p>
              <p className="text-lg font-bold" style={{ color: '#059669' }}>
                ₹{(result.totalPayable / 100000).toFixed(2)}L
              </p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: '#fef3c7' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Total Interest</p>
              <p className="text-lg font-bold" style={{ color: '#d97706' }}>
                ₹{(result.totalInterest / 100000).toFixed(2)}L
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--muted)' }}>
                  <th className="text-left py-1 pr-3">Month</th>
                  <th className="text-right py-1 pr-3">EMI</th>
                  <th className="text-right py-1 pr-3">Principal</th>
                  <th className="text-right py-1 pr-3">Interest</th>
                  <th className="text-right py-1">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1 pr-3" style={{ color: 'var(--muted)' }}>{row.month}</td>
                    <td className="text-right py-1 pr-3">₹{row.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-1 pr-3" style={{ color: '#059669' }}>₹{row.principal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-1 pr-3" style={{ color: '#d97706' }}>₹{row.interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-1">₹{(row.balance / 100000).toFixed(2)}L</td>
                  </tr>
                ))}
                {result.schedule.length > 12 && (
                  <tr>
                    <td colSpan={5} className="text-center py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      + {result.schedule.length - 12} more months
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChatInput
        onSend={sendMessage}
        placeholder="Tell me your loan amount and what you can afford per month…"
        disabled={loading}
      />
    </div>
  );
}
