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
  ChevronRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles
} from 'lucide-react';

type TabId = 'chat' | 'emi' | 'partners';

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'chat',     label: 'AI Assistant',     Icon: Bot },
  { id: 'emi',      label: 'EMI Calculator',   Icon: Calculator },
  { id: 'partners', label: 'Channel Partners', Icon: MapPin },
];

const JOURNEY_STEPS = [
  { label: 'Describe Requirement', key: 'eligibility' },
  { label: 'Select Scheme Match',  key: 'scheme' },
  { label: 'Calculate Repayment',  key: 'emi' },
  { label: 'Locate Nearest Partner', key: 'partner' },
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
  const [journeyOpen, setJourneyOpen] = useState(false);
  const pendingRef = useRef<string | null>(null);

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

    const q = searchParams.get('q');
    if (q) {
      pendingRef.current = q;
      setTab('chat');
    }
    const cid = searchParams.get('chatId');
    if (cid) loadChat(cid, t || null);
  }, [searchParams]);

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
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <NavBar />

      {/* ── Sub Navigation Tab Bar ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          {tab === 'chat' && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 text-slate-500 hover:text-[#0b1f3a] hover:bg-slate-100 rounded-lg transition-colors mr-1 cursor-pointer"
              title={sidebarOpen ? 'Hide history sidebar' : 'Show history sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}

          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0b1f3a] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools in Bar */}
        <div className="flex items-center gap-3">
          {tab === 'chat' && (
            <>
              {/* Progress pill button */}
              <button
                onClick={() => setJourneyOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  journeyOpen
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Progress:</span>
                <span className="font-bold text-amber-700">{progressPct}%</span>
                {journeyOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleNewChat}
                className="bg-[#0b1f3a] hover:bg-[#132e54] text-white text-xs font-bold px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>New Session</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Workspace Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Collapsible Left Sidebar */}
        {tab === 'chat' && sidebarOpen && (
          <div className="w-64 sm:w-72 border-r border-slate-200 bg-white flex-shrink-0 flex flex-col z-10 animate-slide-left shadow-sm">
            <Sidebar
              token={token}
              currentChatId={chatId}
              refreshSignal={refreshSignal}
              onSelectChat={handleChatSelect}
              onNewChat={handleNewChat}
            />
          </div>
        )}

        {/* Central Workspace Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
          {tab === 'chat' && (
            <ChatInterface
              chatId={chatId}
              token={token}
              onChatCreated={handleChatCreated}
              initialMessages={initialMessages}
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

        {/* Collapsible Right Journey Panel */}
        {tab === 'chat' && journeyOpen && (
          <aside className="w-72 sm:w-80 border-l border-slate-200 bg-white flex-shrink-0 flex flex-col z-10 animate-slide-right shadow-sm p-5 space-y-6 overflow-y-auto">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#0b1f3a]" />
                  <h3 className="text-sm font-bold text-slate-900">Application Checklist</h3>
                </div>
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {progressPct}% Done
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Steps to Follow
              </span>
              {JOURNEY_STEPS.map((step) => {
                const isDone = journeyDone[step.key];
                return (
                  <div
                    key={step.key}
                    onClick={() => markStep(step.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-semibold ${isDone ? 'line-through opacity-75' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                );
              })}
            </div>

            {/* Quick Guidance Tip */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold">Pro Tip</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Mentioning your annual family income (e.g. ₹2.5L) and required amount helps the AI filter out ineligible schemes instantly.
              </p>
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
