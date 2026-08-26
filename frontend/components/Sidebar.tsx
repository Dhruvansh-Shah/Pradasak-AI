'use client';

import { useEffect, useState, useCallback } from 'react';
import { listChats, deleteChat } from '@/lib/api';
import type { ChatSummary } from '@/lib/api';
import { MessageSquare, Trash2, Plus, LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  token: string | null;
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
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

export default function Sidebar({ token, currentChatId, onSelectChat, onNewChat, refreshSignal }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listChats(token);
      setChats(data);
    } catch {}
  }, [token]);

  useEffect(() => { loadChats(); }, [loadChats, refreshSignal]);

  async function handleDelete(e: React.MouseEvent, chatId: string) {
    e.stopPropagation();
    if (!token) return;
    setDeleting(chatId);
    try {
      await deleteChat(chatId, token);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) onNewChat();
    } catch {}
    setDeleting(null);
  }

  const groups = groupByDate(chats);

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center pt-4 pb-4 gap-3"
        style={{
          width: 52,
          background: 'var(--sidebar-bg, #1a1a2e)',
          borderRight: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--muted)' }}
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--muted)' }}
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        width: 240,
        background: 'var(--sidebar-bg, #1a1a2e)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Conversations
        </span>
        <div className="flex gap-1">
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
            title="Collapse"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {!token ? (
          <div className="px-2 py-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Sign in to save and revisit your conversations.
            </p>
            <Link
              href="/auth"
              className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </Link>
          </div>
        ) : chats.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No chats yet. Start a conversation!</p>
          </div>
        ) : (
          Object.entries(groups).map(([group, items]) =>
            items.length === 0 ? null : (
              <div key={group} className="mb-3">
                <div className="text-xs px-2 py-1.5 font-semibold" style={{ color: 'var(--muted)' }}>
                  {group}
                </div>
                {items.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors mb-0.5"
                    style={{
                      background: currentChatId === chat.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (currentChatId !== chat.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (currentChatId !== chat.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                    <span
                      className="flex-1 text-xs truncate"
                      style={{ color: currentChatId === chat.id ? 'var(--foreground)' : 'var(--muted)' }}
                    >
                      {chat.title}
                    </span>
                    <button
                      onClick={e => handleDelete(e, chat.id)}
                      disabled={deleting === chat.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:opacity-70"
                      style={{ color: 'var(--muted)' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
