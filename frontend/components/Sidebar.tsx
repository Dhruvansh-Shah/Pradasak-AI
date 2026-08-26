'use client';

import { useEffect, useState, useCallback } from 'react';
import { listChats, deleteChat } from '@/lib/api';
import type { ChatSummary } from '@/lib/api';
import { MessageSquare, Trash2, Plus, LogIn, Sparkles, Clock } from 'lucide-react';
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

export default function Sidebar({
  token,
  currentChatId,
  onSelectChat,
  onNewChat,
  refreshSignal,
}: Props) {
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
    <div className="flex flex-col h-full bg-slate-900 text-white w-full">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Chats
          </span>
        </div>

        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!token ? (
          <div className="p-5 text-center bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in to save your conversation history across devices.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors w-full"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No saved sessions yet.
          </div>
        ) : (
          Object.entries(groups).map(([group, items]) =>
            items.length === 0 ? null : (
              <div key={group} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  {group}
                </div>
                {items.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      currentChatId === chat.id
                        ? 'bg-amber-500/20 text-white border border-amber-500/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="flex-1 text-xs font-medium truncate">
                      {chat.title || 'Inquiry Session'}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      disabled={deleting === chat.id}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
