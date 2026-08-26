'use client';

import { useEffect, useState, useCallback } from 'react';
import { listChats, deleteChat } from '@/lib/api';
import type { ChatSummary } from '@/lib/api';
import {
  MessageSquare,
  Trash2,
  Plus,
  LogIn,
  Sparkles,
  History,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  token: string | null;
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  refreshSignal?: number;
}

function groupByDate(chats: ChatSummary[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const groups: Record<string, ChatSummary[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    Older: [],
  };

  for (const chat of chats) {
    const d = new Date(chat.updated_at);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups['Today'].push(chat);
    else if (d >= yesterday) groups['Yesterday'].push(chat);
    else if (d >= lastWeek) groups['Last 7 days'].push(chat);
    else groups['Older'].push(chat);
  }

  return groups;
}

export default function Sidebar({
  token,
  currentChatId,
  onSelectChat,
  onNewChat,
  onClose,
  refreshSignal,
}: Props) {
  const { t } = useLanguage();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listChats(token);
      setChats(data);
    } catch {}
  }, [token]);

  useEffect(() => {
    loadChats();
  }, [loadChats, refreshSignal]);

  async function handleDelete(e: React.MouseEvent, chatId: string) {
    e.stopPropagation();
    if (!token) return;
    setDeleting(chatId);
    try {
      await deleteChat(chatId, token);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) onNewChat();
    } catch {}
    setDeleting(null);
  }

  const groups = groupByDate(chats);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        borderRight: '1.5px solid #e2e8f0',
        width: '100%',
        boxShadow: '4px 0 24px rgba(11, 31, 58, 0.08)',
      }}
    >
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#eef3f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b1f3a',
            }}
          >
            <History size={16} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0b1f3a' }}>
            {t('chat.past_chats', 'Past Chats')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#0b1f3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(11,31,58,0.15)',
            }}
            title="Start new conversation"
          >
            <Plus size={13} color="#fbbf24" />
            <span>New</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                padding: '6px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Chat List Stream ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!token ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 16,
              padding: '24px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
              }}
            >
              <Sparkles size={20} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                Sign In to Save History
              </strong>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Sync and revisit your past loan inquiries and matched schemes across sessions.
              </p>
            </div>

            <Link
              href="/auth"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                background: '#e87722',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                width: '100%',
                boxShadow: '0 2px 6px rgba(232,119,34,0.3)',
              }}
            >
              <LogIn size={14} />
              <span>{t('nav.signin', 'Sign In')}</span>
            </Link>
          </div>
        ) : chats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: 13 }}>
            No previous conversations yet.
          </div>
        ) : (
          Object.entries(groups).map(([group, items]) =>
            items.length === 0 ? null : (
              <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    padding: '0 6px',
                  }}
                >
                  {group}
                </span>

                {items.map((chat) => {
                  const isCurrent = currentChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isCurrent ? '#eef3f9' : 'transparent',
                        border: isCurrent ? '1.5px solid #0b1f3a' : '1px solid transparent',
                        color: isCurrent ? '#0b1f3a' : '#334155',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                          (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
                        <MessageSquare size={14} color={isCurrent ? '#0b1f3a' : '#94a3b8'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.title || 'Inquiry Session'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, chat.id)}
                        disabled={deleting === chat.id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        title="Delete chat"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
