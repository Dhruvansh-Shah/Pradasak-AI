'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import EmiTab from '@/components/EmiTab';
import PartnersTab from '@/components/PartnersTab';
import type { UserProfile, ChatMessage } from '@/lib/api';
import { getChat } from '@/lib/api';
import {
  Bot,
  Calculator,
  MapPin,
  Plus,
  History,
  ClipboardList,
  CheckCircle2,
  Circle,
  Lightbulb,
  X
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type TabId = 'chat' | 'emi' | 'partners';

const JOURNEY_STEPS = [
  { label: 'Describe Requirement', key: 'eligibility' },
  { label: 'Select Scheme Match',  key: 'scheme' },
  { label: 'Calculate Repayment',  key: 'emi' },
  { label: 'Locate Nearest Partner', key: 'partner' },
];

function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'chat',     label: t('chat.tab_ai', 'AI Scheme Assistant'), Icon: Bot },
    { id: 'emi',      label: t('chat.tab_emi', 'EMI Calculator'),      Icon: Calculator },
    { id: 'partners', label: t('chat.tab_partners', 'Channel Partners'),    Icon: MapPin },
  ];

  const [tab, setTab] = useState<TabId>('chat');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [journeyDone, setJourneyDone] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

  const queryParam = searchParams.get('q');

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    const u = localStorage.getItem('auth_user');
    if (t) setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u) as UserProfile);
      } catch {}
    }

    const tabParam = searchParams.get('tab');
    if (tabParam === 'emi') setTab('emi');
    if (tabParam === 'partners') setTab('partners');

    const cid = searchParams.get('chatId');
    if (cid) loadChat(cid, t || null);
  }, [searchParams]);

  async function loadChat(id: string, t: string | null) {
    if (!t) return;
    try {
      const data = await getChat(id, t);
      setChatId(id);
      setInitialMessages(data.messages || []);
      setSidebarOpen(false);
    } catch {}
  }

  function handleNewChat() {
    setChatId(null);
    setInitialMessages([]);
    setJourneyDone({});
    setRefreshSignal((n) => n + 1);
    router.replace('/chat');
  }

  function handleChatSelect(id: string) {
    loadChat(id, token);
  }

  function handleChatCreated(id: string) {
    setChatId(id);
    setRefreshSignal((n) => n + 1);
    setJourneyDone((prev) => ({ ...prev, eligibility: true }));
  }

  function markStep(key: string) {
    setJourneyDone((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const completedCount = JOURNEY_STEPS.filter((s) => journeyDone[s.key]).length;
  const progressPct = Math.round((completedCount / JOURNEY_STEPS.length) * 100);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900">
      <NavBar />

      {/* ── Segmented Navigation Subheader ─────────────────────────────────── */}
      <div
        className="chat-subheader"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Left: Section Segment Control */}
        <div className="chat-subheader-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tab === 'chat' && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: sidebarOpen ? '#0b1f3a' : '#cbd5e1',
                background: sidebarOpen ? '#0b1f3a' : '#ffffff',
                color: sidebarOpen ? '#ffffff' : '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <History size={14} color={sidebarOpen ? '#fbbf24' : '#e87722'} />
              <span>Past Chats</span>
            </button>
          )}

          <div className="chat-tabs" style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: 10 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    border: 'none',
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#0b1f3a' : '#64748b',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon size={14} color={active ? '#e87722' : '#94a3b8'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="chat-subheader-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tab === 'chat' && (
            <>
              <button
                onClick={() => setJourneyOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: journeyOpen ? '#fed7aa' : '#e2e8f0',
                  background: journeyOpen ? '#fff7ed' : '#ffffff',
                  color: journeyOpen ? '#9a3412' : '#475569',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ClipboardList size={14} color="#ea580c" />
                <span>Checklist: <strong style={{ color: '#c2410c' }}>{progressPct}%</strong></span>
              </button>

              <button
                onClick={handleNewChat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0b1f3a',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11,31,58,0.18)',
                }}
              >
                <Plus size={14} color="#fbbf24" />
                <span>New Chat</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Workspace Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sliding Left History Drawer */}
        {tab === 'chat' && sidebarOpen && (
          <div className="absolute inset-y-0 left-0 z-30 w-72 sm:w-80 shadow-2xl animate-slide-left">
            <Sidebar
              token={token}
              currentChatId={chatId}
              refreshSignal={refreshSignal}
              onSelectChat={handleChatSelect}
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Backdrop for Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs z-20 transition-opacity"
          />
        )}

        {/* Central Workspace Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 w-full min-w-0">
          {tab === 'chat' && (
            <ChatInterface
              chatId={chatId}
              token={token}
              onChatCreated={handleChatCreated}
              initialMessages={initialMessages}
              initialQuery={queryParam}
            />
          )}

          {tab === 'emi' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <EmiTab />
            </div>
          )}

          {tab === 'partners' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <PartnersTab />
            </div>
          )}
        </main>

        {/* Sliding Right Journey Drawer */}
        {tab === 'chat' && journeyOpen && (
          <aside
            className="journey-drawer animate-slide-right"
            style={{
              position: 'absolute',
              insetBlock: 0,
              right: 0,
              zIndex: 30,
              width: 350,
              background: '#ffffff',
              borderLeft: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(11, 31, 58, 0.1)',
            }}
          >
            {/* Header */}
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
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                  }}
                >
                  <ClipboardList size={16} />
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>
                  Application Checklist
                </h3>
              </div>
              <button
                onClick={() => setJourneyOpen(false)}
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
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Progress Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0b1f3a, #16345d)',
                  borderRadius: 16,
                  padding: '16px 18px',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 4px 12px rgba(11,31,58,0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, fontWeight: 700 }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Application Progress</span>
                  <span style={{ color: '#fbbf24', fontSize: 14, fontWeight: 900 }}>{progressPct}% Done</span>
                </div>
                <div style={{ height: 8, width: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #fbbf24, #34d399)',
                      borderRadius: 4,
                      transition: 'width 400ms ease',
                    }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', paddingLeft: 4 }}>
                  Steps to Follow
                </span>
                {JOURNEY_STEPS.map((step) => {
                  const isDone = journeyDone[step.key];
                  return (
                    <div
                      key={step.key}
                      onClick={() => markStep(step.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: isDone ? '#ecfdf5' : '#f8fafc',
                        border: isDone ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                        color: isDone ? '#065f46' : '#334155',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isDone ? (
                          <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                        ) : (
                          <Circle size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: isDone ? 700 : 500, textDecoration: isDone ? 'line-through' : 'none' }}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pro Tip Box */}
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 14,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a3412', fontSize: 12.5, fontWeight: 800 }}>
                  <Lightbulb size={15} color="#ea580c" />
                  <span>Beneficiary Guidance</span>
                </div>
                <p style={{ fontSize: 12, color: '#7c2d12', lineHeight: 1.55, margin: 0 }}>
                  State Channelizing Agencies (SCAs) disburse up to ₹50 Lakh. Microfinance partners handle quick loans up to ₹1.4 Lakh.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function ChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-50">
          <div className="skeleton w-48 h-6 rounded-xl" />
        </div>
      }
    >
      <ChatPage />
    </Suspense>
  );
}
