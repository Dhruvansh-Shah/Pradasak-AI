'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import EmiTab from '@/components/EmiTab';
import PartnersTab from '@/components/PartnersTab';
import type { UserProfile, ChatMessage } from '@/lib/api';
import { listChats, getChat } from '@/lib/api';
import {
  Bot, Calculator, MapPin, Plus, ChevronRight,
  CheckCircle2, Circle, Lightbulb, ClipboardList, Clock
} from 'lucide-react';

type TabId = 'chat' | 'emi' | 'partners';

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'chat',     label: 'Assistant',  Icon: Bot },
  { id: 'emi',      label: 'EMI Calc',   Icon: Calculator },
  { id: 'partners', label: 'Partners',   Icon: MapPin },
];

const JOURNEY_STEPS = [
  { label: 'Eligibility check',      key: 'eligibility' },
  { label: 'Scheme selected',        key: 'scheme' },
  { label: 'Documents identified',   key: 'docs' },
  { label: 'Partner located',        key: 'partner' },
];

const QUICK_PROMPTS = [
  'What schemes am I eligible for?',
  'Calculate EMI for Micro Finance loan',
  'Find partners near Delhi',
  'How do I apply for an education loan?',
];

function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabId>('chat');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [journeyDone, setJourneyDone] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickSent, setQuickSent] = useState(false);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    const u = localStorage.getItem('auth_user');
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u) as UserProfile); } catch {} }

    const q = searchParams.get('q');
    if (q) { pendingRef.current = q; setTab('chat'); }
    const cid = searchParams.get('chatId');
    if (cid) loadChat(cid, t || null);
  }, []);

  async function loadChat(id: string, t: string | null) {
    if (!t) return;
    try {
      const data = await getChat(id, t);
      setChatId(id);
      setInitialMessages(data.messages || []);
    } catch {}
  }

  function handleNewChat() {
    setChatId(null);
    setInitialMessages([]);
    setJourneyDone({});
    setRefreshSignal(n => n + 1);
    router.replace('/chat');
  }

  function handleChatSelect(id: string) {
    loadChat(id, token);
  }

  function handleChatCreated(id: string) {
    setChatId(id);
    setRefreshSignal(n => n + 1);
    setJourneyDone(prev => ({ ...prev, eligibility: true }));
  }

  function markStep(key: string) {
    setJourneyDone(prev => ({ ...prev, [key]: true }));
  }

  const completedCount = JOURNEY_STEPS.filter(s => journeyDone[s.key]).length;
  const progressPct = Math.round((completedCount / JOURNEY_STEPS.length) * 100);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .msg-user { animation: slideInRight .3s cubic-bezier(.4,0,.2,1) both; }
        .msg-bot  { animation: slideInLeft  .3s cubic-bezier(.4,0,.2,1) both; }
        .tab-btn  { transition: all 200ms ease; position: relative; }
        .tab-btn::after {
          content: ''; position: absolute; bottom: 0; left: 12px; right: 12px;
          height: 2px; background: var(--navy); border-radius: 2px;
          transform: scaleX(0); transition: transform 200ms ease;
        }
        .tab-btn.active::after { transform: scaleX(1); }
        .journey-step { transition: all 200ms ease; }
        .journey-step:hover { background: var(--surface); }
        .sidebar-enter { animation: slideInLeft .25s ease both; }
      `}</style>

      <NavBar />

      {/* Tab bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '0 24px',
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`tab-btn${tab === id ? ' active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 16px', border: 'none', background: 'none',
              color: tab === id ? 'var(--navy)' : 'var(--muted)',
              fontWeight: tab === id ? 700 : 500, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={15} strokeWidth={tab === id ? 2.2 : 1.8} />
            {label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {user.name || user.email.split('@')[0]}
            </span>
          )}
          {tab === 'chat' && (
            <button
              onClick={handleNewChat}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: 'var(--navy)', color: 'white',
                border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; }}
            >
              <Plus size={13} /> New Chat
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        {tab === 'chat' && sidebarOpen && (
          <div className="sidebar-enter" style={{ width: 220, borderRight: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            <Sidebar
              token={token}
              currentChatId={chatId}
              refreshSignal={refreshSignal}
              onSelectChat={handleChatSelect}
              onNewChat={handleNewChat}
            />
          </div>
        )}

        {/* Main panel */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'chat' && (
            <ChatInterface
              chatId={chatId}
              token={token}
              onChatCreated={handleChatCreated}
              initialMessages={initialMessages}
            />
          )}
          {tab === 'emi' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <EmiTab />
            </div>
          )}
          {tab === 'partners' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <PartnersTab />
            </div>
          )}
        </div>

        {/* Journey panel — only on chat tab */}
        {tab === 'chat' && (
          <div style={{
            width: 240, borderLeft: '1px solid var(--border)',
            background: 'white', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', flexShrink: 0,
            animation: 'slideInRight .3s ease both',
          }}>
            {/* Progress header */}
            <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ClipboardList size={14} color="var(--navy)" />
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Application Journey</h3>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'var(--navy)',
                  width: `${progressPct}%`,
                  borderRadius: 4, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
            </div>

            {/* Steps */}
            <div style={{ padding: '12px 0' }}>
              {JOURNEY_STEPS.map((step, i) => {
                const done = journeyDone[step.key];
                return (
                  <div
                    key={step.key}
                    className="journey-step"
                    onClick={() => markStep(step.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', cursor: 'pointer', borderRadius: 0,
                    }}
                  >
                    {done
                      ? <CheckCircle2 size={18} color="var(--success)" strokeWidth={2} style={{ flexShrink: 0 }} />
                      : <Circle size={18} color="var(--border-dark)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    }
                    <span style={{
                      fontSize: 12.5, fontWeight: done ? 600 : 400,
                      color: done ? 'var(--text)' : 'var(--text-secondary)',
                      textDecoration: done ? 'none' : 'none',
                      transition: 'color 200ms ease',
                    }}>
                      {step.label}
                    </span>
                    {!done && (
                      <ChevronRight size={12} color="var(--muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick tip */}
            <div style={{ margin: '8px 12px', padding: '12px 14px', background: '#fffbf0', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Lightbulb size={13} color="#d97706" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.04em' }}>Quick Tip</span>
              </div>
              <p style={{ fontSize: 11.5, color: '#78350f', lineHeight: 1.55 }}>
                Tell the assistant your annual family income and purpose — it will narrow down scheme recommendations instantly.
              </p>
            </div>

            {/* Recent history link */}
            {token && (
              <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Clock size={13} color="var(--muted)" />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Chats</span>
                </div>
                <RecentChatsList token={token} onSelect={handleChatSelect} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentChatsList({ token, onSelect }: { token: string; onSelect: (id: string) => void }) {
  const [chats, setChats] = useState<{ id: string; title?: string; created_at?: string }[]>([]);

  useEffect(() => {
    listChats(token).then(data => setChats(data.slice(0, 3))).catch(() => {});
  }, [token]);

  if (!chats.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {chats.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
            padding: '5px 6px', borderRadius: 6, fontSize: 12,
            color: 'var(--text-secondary)', fontWeight: 400,
            transition: 'all 150ms ease', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          {c.title || `Chat ${c.id.slice(0, 8)}`}
        </button>
      ))}
    </div>
  );
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 10 }} />
      </div>
    }>
      <ChatPage />
    </Suspense>
  );
}
