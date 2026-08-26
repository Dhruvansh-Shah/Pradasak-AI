'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({ onSend, placeholder = 'Type your message...', disabled }: Props) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex items-end gap-2 p-3 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <textarea
        className="flex-1 resize-none outline-none text-sm leading-relaxed"
        style={{ background: 'transparent', color: 'var(--foreground)', minHeight: '40px', maxHeight: '120px' }}
        rows={1}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity flex-shrink-0"
        style={{
          background: 'var(--accent)',
          opacity: disabled || !value.trim() ? 0.4 : 1,
        }}
      >
        <Send className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
