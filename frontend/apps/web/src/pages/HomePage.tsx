import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { createRoom, generateToken, preferencesApi } from '@dozi/api-client';
import {
  createConversation,
  updateConversationRoom,
  listConversationsByMode,
  countConversationsByMode,
  deleteConversation,
  getPreferences,
  type Conversation,
} from '../lib/db';
import { useAuthStore } from '../store/authStore';
import {
  LogOut,
  Users,
  Phone,
  Briefcase,
  Settings,
  Clock,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Mic,
  AlertCircle,
  X,
} from 'lucide-react';

type Mode = 'meeting' | 'call' | 'interview';

const PAGE_SIZE = 8;

const TABS = [
  {
    mode: 'meeting' as Mode,
    label: 'Meetings',
    singular: 'Meeting',
    icon: Users,
    iconBg: 'bg-blue-500',
    tabActiveText: 'text-blue-600',
    tabActiveBorder: 'border-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    badgeActive: 'bg-blue-100 text-blue-700',
    emptyBg: 'bg-blue-50',
    emptyIcon: 'text-blue-400',
    cardBorder: 'border-l-blue-400',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
  },
  {
    mode: 'interview' as Mode,
    label: 'Interviews',
    singular: 'Interview',
    icon: Briefcase,
    iconBg: 'bg-violet-500',
    tabActiveText: 'text-violet-600',
    tabActiveBorder: 'border-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    badgeActive: 'bg-violet-100 text-violet-700',
    emptyBg: 'bg-violet-50',
    emptyIcon: 'text-violet-400',
    cardBorder: 'border-l-violet-400',
    selectedBorder: 'border-violet-500',
    selectedBg: 'bg-violet-50',
  },
  {
    mode: 'call' as Mode,
    label: 'Sales Calls',
    singular: 'Sales Call',
    icon: Phone,
    iconBg: 'bg-emerald-500',
    tabActiveText: 'text-emerald-600',
    tabActiveBorder: 'border-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeActive: 'bg-emerald-100 text-emerald-700',
    emptyBg: 'bg-emerald-50',
    emptyIcon: 'text-emerald-400',
    cardBorder: 'border-l-emerald-400',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50',
  },
] as const;

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' }) + ` at ${timeStr}`;
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}

function getUserInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

// ─── New Session Form ────────────────────────────────────────────────────────

function NewSessionForm({ onClose }: { onClose?: () => void }) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<Mode>('meeting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleStart = async () => {
    if (!title.trim()) {
      setError('Please enter a session title');
      return;
    }
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const conversation = await createConversation(title.trim(), mode);
      const [prefs, models] = await Promise.all([getPreferences(), preferencesApi.getModels()]);
      const s = (prefs?.settings ?? {}) as Record<string, unknown>;
      const sttModel = (s.stt_model as string | undefined) ?? models.defaults.stt_model;
      const sttEntry = models.stt.find((m) => m.model === sttModel);
      const metadata: Record<string, unknown> = {
        stt_model: sttModel,
        stt_provider: sttEntry?.provider,
      };
      if (s.min_silence_duration !== undefined) metadata.min_silence_duration = s.min_silence_duration;
      if (s.min_speech_duration !== undefined) metadata.min_speech_duration = s.min_speech_duration;

      const roomResponse = await createRoom({ metadata });
      await updateConversationRoom(conversation.id, roomResponse.room_name);
      const tokenResponse = await generateToken({
        room_name: roomResponse.room_name,
        participant_identity: user.id,
        participant_name: user.email ?? undefined,
      });

      sessionStorage.setItem('livekit_token', tokenResponse.token);
      sessionStorage.setItem('livekit_url', tokenResponse.url);
      sessionStorage.setItem('conversationId', conversation.id);
      sessionStorage.setItem('conversationMode', mode);
      sessionStorage.setItem('conversationTitle', title.trim());

      onClose?.();
      navigate(`/session/${conversation.id}`);
    } catch (err) {
      console.error('[NewSessionForm] Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-4">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide">New Session</h2>
        </div>
        <p className="text-xs text-blue-200 pl-8">Real-time AI insights as you talk</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="session-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Session title
          </label>
          <input
            id="session-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="e.g., Q4 Strategy Meeting"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-300"
            disabled={loading}
          />
        </div>

        {/* Mode cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Session type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = mode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setMode(tab.mode)}
                  disabled={loading}
                  className={`p-3 rounded-xl border-2 text-center transition-all disabled:opacity-50 ${
                    selected
                      ? `${tab.selectedBorder} ${tab.selectedBg}`
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div
                    className={`w-7 h-7 ${selected ? tab.iconBg : 'bg-slate-200'} rounded-lg flex items-center justify-center mx-auto mb-1.5 transition-colors`}
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div
                    className={`text-xs font-semibold leading-tight ${selected ? 'text-slate-800' : 'text-slate-400'}`}
                  >
                    {tab.singular}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || !title.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Start Session
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({
  session,
  tab,
  onDelete,
  onOpen,
}: {
  session: Conversation;
  tab: (typeof TABS)[number];
  onDelete: (id: string) => Promise<void>;
  onOpen: (session: Conversation) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const Icon = tab.icon;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(session.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      onClick={() => !confirmDelete && onOpen(session)}
      className={`group relative bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer border-l-4 ${tab.cardBorder} select-none`}
    >
      <div className="flex items-center gap-3">
        {/* Mode icon */}
        <div
          className={`w-9 h-9 ${tab.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 truncate">{session.title}</span>
            <span
              className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                session.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : session.status === 'completed'
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span>{formatDate(session.created_at)}</span>
            {session.duration_seconds !== null && (
              <>
                <span className="text-slate-200">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(session.duration_seconds)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions area */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-xs text-slate-400 hidden sm:block">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                exit={{ opacity: 0 }}
                className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(session);
                  }}
                  className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open summary"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  count,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  count: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, count);

  // Build page number sequence with ellipsis
  const pages: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
      <p className="text-xs text-slate-400">
        {start}–{end} of {count} sessions
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="w-7 text-center text-xs text-slate-300 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p + 1}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Mode>('meeting');
  const [page, setPage] = useState(0);
  const [sessions, setSessions] = useState<Conversation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<Mode, number>>({ meeting: 0, interview: 0, call: 0 });
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [m, i, c] = await Promise.all([
        countConversationsByMode('meeting'),
        countConversationsByMode('interview'),
        countConversationsByMode('call'),
      ]);
      setTabCounts({ meeting: m, interview: i, call: c });
    } catch (err) {
      console.error('[HomePage] Failed to load counts:', err);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const { data, count } = await listConversationsByMode(activeTab, PAGE_SIZE, page * PAGE_SIZE);
      setSessions(data);
      setTotalCount(count);
    } catch (err) {
      console.error('[HomePage] Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [user, activeTab, page]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTabChange = (mode: Mode) => {
    setActiveTab(mode);
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    await loadCounts();
    if (sessions.length === 1 && page > 0) {
      setPage((p) => p - 1); // useEffect will reload
    } else {
      await loadSessions();
    }
  };

  const handleOpen = (session: Conversation) => {
    navigate(`/conversations/${session.id}`);
  };

  const activeTabConfig = TABS.find((t) => t.mode === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div className="leading-none">
                <span className="text-base font-bold text-slate-900 tracking-tight">Dozi</span>
                <span className="hidden sm:block text-xs text-slate-400">AI Sales Assistant</span>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5">
              {/* Mobile new session button */}
              <button
                onClick={() => setMobileFormOpen(true)}
                className="sm:hidden flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>

              {/* Settings */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Settings"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>

              {/* User avatar + dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-xs font-bold text-white">
                      {user?.email ? getUserInitials(user.email) : '?'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-600 max-w-[160px] truncate">
                    {user?.email}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile: New Session Bottom Sheet ───────────────────────────────── */}
      <AnimatePresence>
        {mobileFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 sm:hidden bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFormOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute bottom-0 left-0 right-0 bg-slate-50 rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <h3 className="font-bold text-slate-900 text-base">Start a new session</h3>
                <button
                  onClick={() => setMobileFormOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="px-4 pb-6">
                <NewSessionForm onClose={() => setMobileFormOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">
          {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
          <aside className="hidden sm:flex flex-col gap-4 w-72 lg:w-80 flex-shrink-0">
            <div className="sticky top-[57px]">
              <NewSessionForm />

              {/* Activity summary card */}
              <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Your Activity
                </p>
                <div className="space-y-1.5">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.mode;
                    return (
                      <button
                        key={tab.mode}
                        onClick={() => handleTabChange(tab.mode)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 ${tab.iconBg} rounded-lg flex items-center justify-center shadow-sm`}
                          >
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">{tab.label}</span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${tab.badge}`}
                        >
                          {tabCounts[tab.mode]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Content ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Tab strip */}
              <div className="border-b border-slate-100">
                <div className="flex">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.mode;
                    return (
                      <button
                        key={tab.mode}
                        onClick={() => handleTabChange(tab.mode)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                          isActive
                            ? `${tab.tabActiveText} ${tab.tabActiveBorder}`
                            : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? tab.badge : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {tabCounts[tab.mode]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session list */}
              <div className="p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div
                          className={`w-14 h-14 ${activeTabConfig.emptyBg} rounded-2xl flex items-center justify-center mb-4`}
                        >
                          <activeTabConfig.icon
                            className={`w-7 h-7 ${activeTabConfig.emptyIcon}`}
                          />
                        </div>
                        <h3 className="text-sm font-bold text-slate-600 mb-1">
                          No {activeTabConfig.label.toLowerCase()} yet
                        </h3>
                        <p className="text-xs text-slate-400 max-w-[200px]">
                          Start a new session to capture your first{' '}
                          {activeTabConfig.singular.toLowerCase()}
                        </p>
                        <button
                          onClick={() => setMobileFormOpen(true)}
                          className="sm:hidden mt-4 flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          New session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence>
                          {sessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              tab={activeTabConfig}
                              onDelete={handleDelete}
                              onOpen={handleOpen}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {totalPages > 1 && !loadingSessions && (
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        count={totalCount}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
