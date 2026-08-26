'use client';

import { Landmark, User } from 'lucide-react';

interface Props {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: isUser ? 'var(--accent-light)' : 'var(--accent)' }}
      >
        {isUser ? (
          <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        ) : (
          <Landmark className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--surface)',
          color: isUser ? '#fff' : 'var(--foreground)',
          border: isUser ? 'none' : `1px solid var(--border)`,
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        }}
      >
        {content}
      </div>
    </div>
  );
}
