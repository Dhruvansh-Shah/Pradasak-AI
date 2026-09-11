'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import EmiTab from '@/components/EmiTab';
import PartnersTab from '@/components/PartnersTab';
import ShareModal from '@/components/ShareModal';
import type { UserProfile, ChatMessage } from '@/lib/api';
import { getChat, shareChat, importGuestChat } from '@/lib/api';
import {
  MessageSquare,
  Calculator,
  MapPin,
  Plus,
  History,
  ClipboardList,
  CheckCircle2,
  Circle,
  Lightbulb,
  X,
  Share2,
  Loader2,
  AlertCircle,
  Check,
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
  const pathname = usePathname();
  const basePath = pathname === '/' ? '/' : '/chat';
  const { t } = useLanguage();

  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'chat',     label: t('chat.tab_ai', 'Scheme Advisory'),     Icon: MessageSquare },
    { id: 'emi',      label: t('chat.tab_emi', 'EMI Calculator'),      Icon: Calculator },
    { id: 'partners', label: t('nav.partners', 'Partner Locator'),     Icon: MapPin },
  ];

  const [tab, setTab] = useState<TabId>('chat');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [journeyDone, setJourneyDone] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Auth gating & Sharing UI states
  const [guestPastChatsPrompt, setGuestPastChatsPrompt] = useState(false);
  const [guestSharePrompt, setGuestSharePrompt] = useState(false);
  const [emptyShareNotice, setEmptyShareNotice] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalUrl, setShareModalUrl] = useState('');
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  const queryParam = searchParams.get('q');

  // Dismiss floating guest tooltips when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = () => {
      setGuestPastChatsPrompt(false);
      setGuestSharePrompt(false);
      setEmptyShareNotice(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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
    if (tabParam === 'emi') {
      setTab('emi');
    } else if (tabParam === 'partners') {
      router.replace('/partners');
      return;
    } else {
      setTab('chat');
    }

    const cid = searchParams.get('chatId');
    if (cid) {
      if (cid !== activeChatIdRef.current) {
        activeChatIdRef.current = cid;
        loadChat(cid, t || null);
      }
    } else if (activeChatIdRef.current !== null) {
      activeChatIdRef.current = null;
      setChatId(null);
      setInitialMessages([]);
      setCurrentMessages([]);
      setJourneyDone({});
      setResetKey((k) => k + 1);
    }
  }, [searchParams]);

  // Automatic Migration after Sign In or Registration
  useEffect(() => {
    if (!token) return;

    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('pradarshak_active_chat');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed.messages &&
            parsed.messages.length > 0 &&
            !parsed.persistedToDb
          ) {
            const firstUserMsg = parsed.messages.find((m: any) => m.role === 'user');
            importGuestChat(
              parsed.clientChatId || 'guest-' + Date.now().toString(36),
              parsed.messages,
              token,
              firstUserMsg?.text || firstUserMsg?.content
            )
              .then((res) => {
                sessionStorage.setItem(
                  'pradarshak_active_chat',
                  JSON.stringify({
                    ...parsed,
                    chatId: res.id,
                    persistedToDb: true,
                  })
                );
                activeChatIdRef.current = res.id;
                setChatId(res.id);
                setRefreshSignal((n) => n + 1);
                router.replace(`${basePath}?chatId=${res.id}`);
              })
              .catch((err) => {
                console.warn('Auto-save chat error:', err);
                setMigrationNotice(
                  "We couldn't save this chat yet. We'll keep it here and try again."
                );
                setTimeout(() => setMigrationNotice(null), 6000);
              });
          }
        }
      } catch (err) {
        console.error('Session migration error:', err);
      }
    }
  }, [token, router]);

  async function loadChat(id: string, t: string | null) {
    if (!t) return;
    try {
      const data = await getChat(id, t);
      activeChatIdRef.current = id;
      setChatId(id);
      setInitialMessages(data.messages || []);
      setSidebarOpen(false);
      router.replace(`${basePath}?chatId=${id}`);
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  }

  const handleStepComplete = useCallback((stepKey: 'eligibility' | 'scheme' | 'emi' | 'partner') => {
    setJourneyDone((prev) => {
      const alreadyElig = !!prev.eligibility;
      const alreadyScheme = !!prev.scheme;
      const alreadyEmi = !!prev.emi;
      const alreadyPartner = !!prev.partner;

      if (stepKey === 'eligibility' && alreadyElig) return prev;
      if (stepKey === 'scheme' && alreadyElig && alreadyScheme) return prev;
      if (stepKey === 'emi' && alreadyElig && alreadyScheme && alreadyEmi) return prev;
      if (stepKey === 'partner' && alreadyElig && alreadyScheme && alreadyEmi && alreadyPartner) return prev;

      const next = { ...prev };
      if (stepKey === 'eligibility') {
        next.eligibility = true;
      } else if (stepKey === 'scheme') {
        next.eligibility = true;
        next.scheme = true;
      } else if (stepKey === 'emi') {
        next.eligibility = true;
        next.scheme = true;
        next.emi = true;
      } else if (stepKey === 'partner') {
        next.eligibility = true;
        next.scheme = true;
        next.emi = true;
        next.partner = true;
      }
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pradarshak_active_chat');
    }
    activeChatIdRef.current = null;
    setChatId(null);
    setInitialMessages([]);
    setCurrentMessages([]);
    setJourneyDone({});
    setRefreshSignal((n) => n + 1);
    setSidebarOpen(false);
    setGuestPastChatsPrompt(false);
    setGuestSharePrompt(false);
    setEmptyShareNotice(false);
    setResetKey((k) => k + 1);
    router.replace(basePath);
  }, [basePath, router]);

  const handleChatSelect = useCallback((id: string) => {
    activeChatIdRef.current = id;
    loadChat(id, token);
  }, [token]);

  const handleChatCreated = useCallback((id: string) => {
    activeChatIdRef.current = id;
    setChatId(id);
    setRefreshSignal((n) => n + 1);
    handleStepComplete('eligibility');
    router.replace(`${basePath}?chatId=${id}`);
  }, [basePath, handleStepComplete, router]);

  const [copyToastNotice, setCopyToastNotice] = useState(false);

  // Share Click Handler (Guests -> prompt; Signed-in -> verify persisted, generate share URL & open NATIVE OS share sheet directly)
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Guest Flow
    if (!token) {
      setGuestPastChatsPrompt(false);
      setGuestSharePrompt((prev) => !prev);
      return;
    }

    // 2. Signed-in: verify non-empty chat
    console.log('[share-debug] currentMessages:', currentMessages?.length, 'chatId:', chatId);
    const hasMessages = currentMessages && currentMessages.length > 0;
    if (!hasMessages) {
      console.warn('[share-debug] BLOCKED: currentMessages is empty');
      setEmptyShareNotice(true);
      setTimeout(() => setEmptyShareNotice(false), 4000);
      return;
    }

    setSharingInProgress(true);
    try {
      let targetChatId = chatId;
      console.log('[share-debug] targetChatId before persist check:', targetChatId);

      // If not yet persisted in database, save it first
      if (!targetChatId) {
        console.log('[share-debug] Chat not persisted, importing...');
        const firstUserMsg = currentMessages.find((m: any) => m.role === 'user');
        const importRes = await importGuestChat(
          'user-' + Date.now().toString(36),
          currentMessages,
          token,
          firstUserMsg?.text || firstUserMsg?.content
        );
        targetChatId = importRes.id;
        setChatId(importRes.id);
        setRefreshSignal((n) => n + 1);
        console.log('[share-debug] Imported as:', targetChatId);
      }

      // Generate share URL
      console.log('[share-debug] Calling shareChat with id:', targetChatId);
      const shareRes = await shareChat(targetChatId!, token);
      console.log('[share-debug] shareRes:', shareRes);
      const fullUrl = `${window.location.origin}/chat/shared/${shareRes.shareId}`;
      const chatTitle = currentMessages.find((m: any) => m.role === 'user')?.text?.slice(0, 45) || 'PradarshakAI Chat';

      // 3. Directly Invoke System / Native OS Share Sheet (No intermediate custom modal)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'PradarshakAI Chat',
          text: `View this PradarshakAI conversation: ${chatTitle}`,
          url: fullUrl,
        });
      } else {
        // Fallback for desktop/browsers without native Web Share API support
        try {
          await navigator.clipboard.writeText(fullUrl);
          setCopyToastNotice(true);
          setTimeout(() => setCopyToastNotice(false), 3500);
        } catch {
          const input = document.createElement('input');
          input.value = fullUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          setCopyToastNotice(true);
          setTimeout(() => setCopyToastNotice(false), 3500);
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[share-debug] FAILED:', err);
        alert('Failed to generate share link. Please try again.');
      }
    } finally {
      setSharingInProgress(false);
    }
  };

  function markStep(key: string) {
    setJourneyDone((prev) => {
      const isDone = !prev[key];
      const next = { ...prev, [key]: isDone };
      if (isDone) {
        if (key === 'scheme' || key === 'emi' || key === 'partner') next.eligibility = true;
        if (key === 'emi' || key === 'partner') next.scheme = true;
        if (key === 'partner') next.emi = true;
      }
      return next;
    });
  }

  const completedCount = JOURNEY_STEPS.filter((s) => journeyDone[s.key]).length;
  const progressPct = Math.round((completedCount / JOURNEY_STEPS.length) * 100);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900">
      <NavBar />

      {/* Migration / Non-blocking Notice Toast */}
      {migrationNotice && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(11,31,58,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={15} color="#2563eb" />
          <span>{migrationNotice}</span>
        </div>
      )}

      {/* ── Main Workspace Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Controls Overlay */}
        {tab === 'chat' && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 25,
              pointerEvents: 'none',
              gap: 8,
            }}
          >
            {/* Top-Left: [ Past Chats ] [ Share Chat ] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', position: 'relative' }}>
              {/* [ Past Chats ] */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!token) {
                      setGuestSharePrompt(false);
                      setGuestPastChatsPrompt((v) => !v);
                    } else {
                      setSidebarOpen((v) => !v);
                    }
                  }}
                  className="interactive-control"
                  style={{
                    display: 'inline-flex',
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
                    boxShadow: '0 2px 8px rgba(11,31,58,0.08)',
                    transition: 'all 150ms ease',
                  }}
                  title={t('chat.past_chats', 'Past Chats')}
                >
                  <History size={14} color={sidebarOpen ? '#fbbf24' : '#e87722'} />
                  <span className="hidden sm:inline">{t('chat.past_chats', 'Past Chats')}</span>
                  <span className="sm:hidden">History</span>
                </button>

                {/* Guest Past Chats Auth Popover */}
                {!token && guestPastChatsPrompt && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-slide-down"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 40,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '8px 14px',
                      boxShadow: '0 8px 20px rgba(11,31,58,0.14)',
                      fontSize: 12.5,
                      color: '#334155',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>
                      <Link
                        href="/auth?returnUrl=/chat"
                        style={{
                          color: '#1d4ed8',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Sign in
                      </Link>{' '}
                      to store chats
                    </span>
                    <button
                      onClick={() => setGuestPastChatsPrompt(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* [ Share Chat ] */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={handleShareClick}
                  disabled={sharingInProgress}
                  className="interactive-control"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: sharingInProgress ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(11,31,58,0.08)',
                    transition: 'all 150ms ease',
                  }}
                  title={t('chat.share_chat', 'Share Chat')}
                >
                  {sharingInProgress ? (
                    <Loader2 size={14} color="#0284c7" className="animate-spin" />
                  ) : (
                    <Share2 size={14} color="#0284c7" />
                  )}
                  <span className="hidden sm:inline">{t('chat.share_chat', 'Share Chat')}</span>
                  <span className="sm:hidden">Share</span>
                </button>

                {/* Guest Share Auth Popover */}
                {!token && guestSharePrompt && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-slide-down"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 40,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '8px 14px',
                      boxShadow: '0 8px 20px rgba(11,31,58,0.14)',
                      fontSize: 12.5,
                      color: '#334155',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>
                      <Link
                        href="/auth?returnUrl=/chat"
                        style={{
                          color: '#0284c7',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Sign in
                      </Link>{' '}
                      to share this chat
                    </span>
                    <button
                      onClick={() => setGuestSharePrompt(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Empty Chat Notice (Signed-in) */}
                {token && emptyShareNotice && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-slide-down"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 40,
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 10,
                      padding: '8px 14px',
                      boxShadow: '0 8px 20px rgba(11,31,58,0.14)',
                      fontSize: 12.5,
                      color: '#9a3412',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>Start a conversation before sharing this chat.</span>
                    <button
                      onClick={() => setEmptyShareNotice(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ea580c',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Copy Link Toast Fallback (For desktop browsers without Web Share API) */}
                {copyToastNotice && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-slide-down"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 40,
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: 10,
                      padding: '8px 14px',
                      boxShadow: '0 8px 20px rgba(11,31,58,0.14)',
                      fontSize: 12.5,
                      color: '#15803d',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Check size={14} color="#16a34a" />
                    <span>Link copied to clipboard</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top-Right: [ Checklist: X% ] [ + New Chat ] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
              <button
                onClick={() => setJourneyOpen((v) => !v)}
                className="interactive-control"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: journeyOpen ? '#fed7aa' : '#cbd5e1',
                  background: journeyOpen ? '#fff7ed' : '#ffffff',
                  color: journeyOpen ? '#9a3412' : '#334155',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(11,31,58,0.08)',
                  transition: 'all 150ms ease',
                }}
                title={t('chat.checklist', 'Checklist')}
              >
                <ClipboardList size={14} color="#ea580c" />
                <span>
                  <span className="hidden sm:inline">{t('chat.checklist', 'Checklist')}: </span>
                  <strong style={{ color: '#c2410c' }}>{progressPct}%</strong>
                </span>
              </button>

              <button
                onClick={handleNewChat}
                className="interactive-control"
                style={{
                  display: 'inline-flex',
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
                  boxShadow: '0 2px 8px rgba(11,31,58,0.18)',
                  transition: 'all 150ms ease',
                }}
                title={t('chat.new_chat', 'New Chat')}
              >
                <Plus size={14} color="#fbbf24" />
                <span>{t('chat.new_chat', 'New Chat')}</span>
              </button>
            </div>
          </div>
        )}

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
              resetKey={resetKey}
              token={token}
              onChatCreated={handleChatCreated}
              onStepComplete={handleStepComplete}
              onMessagesChange={(msgs, activeId) => {
                setCurrentMessages(msgs);
                if (activeId && activeId !== activeChatIdRef.current) {
                  activeChatIdRef.current = activeId;
                  setChatId(activeId);
                }
              }}
              initialMessages={initialMessages}
              initialQuery={queryParam}
              category={searchParams.get('category')}
            />
          )}

          {tab === 'emi' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <EmiTab
                onSchemeSelect={(query) => {
                  setTab('chat');
                  router.push(`${basePath}?tab=chat&q=${encodeURIComponent(query)}`);
                }}
              />
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
            className="material-sheet animate-slide-right"
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
                  {t('chat.checklist_title', 'Application Checklist')}
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
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{t('chat.app_progress', 'Application Progress')}</span>
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
                  {t('chat.steps_to_follow', 'Steps to Follow')}
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
                        transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
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
                  <span>{t('chat.beneficiary_guidance', 'Beneficiary Guidance')}</span>
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
