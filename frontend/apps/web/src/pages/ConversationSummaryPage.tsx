import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getConversation,
  getTranscriptions,
  getBattleCards,
  type Conversation,
  type Transcription,
  type BattleCard,
  type BattleCardInsight,
} from '../lib/db';
import {
  ArrowLeft,
  Users,
  Phone,
  Briefcase,
  Clock,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

const MODE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; iconBg: string; badge: string }
> = {
  meeting: {
    label: 'Meeting',
    icon: Users,
    iconBg: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  interview: {
    label: 'Interview',
    icon: Briefcase,
    iconBg: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
  },
  call: {
    label: 'Sales Call',
    icon: Phone,
    iconBg: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
};

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  key_point: Lightbulb,
  objection: AlertCircle,
  suggestion: MessageSquare,
  action_item: TrendingUp,
};

const PRIORITY_STYLES: Record<string, { text: string; bg: string; dot: string }> = {
  high: { text: 'text-red-600', bg: 'bg-red-50 border-red-100', dot: 'bg-red-400' },
  medium: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-400' },
  low: { text: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-300' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type SummaryTab = 'transcript' | 'insights';

export default function ConversationSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [battleCards, setBattleCards] = useState<BattleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SummaryTab>('transcript');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getConversation(id), getTranscriptions(id), getBattleCards(id)])
      .then(([conv, txns, cards]) => {
        setConversation(conv);
        setTranscriptions(txns);
        setBattleCards(cards);
      })
      .catch((err) => {
        console.error('[ConversationSummaryPage] Load failed:', err);
        setError('Failed to load session data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">{error ?? 'Session not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const modeConfig = MODE_CONFIG[conversation.mode] ?? MODE_CONFIG['meeting'];
  const ModeIcon = modeConfig.icon;
  const latestCard = battleCards[0] ?? null;
  const insightCount = latestCard?.insights?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div
                className={`w-7 h-7 ${modeConfig.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
                <ModeIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-sm font-bold text-slate-900 truncate">{conversation.title}</h1>
              <span
                className={`flex-shrink-0 hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${modeConfig.badge}`}
              >
                {modeConfig.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Meta card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(conversation.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Duration</p>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDuration(conversation.duration_seconds)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  conversation.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : conversation.status === 'completed'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {conversation.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Transcripts</p>
              <p className="text-sm font-medium text-slate-700">{transcriptions.length} entries</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Insights</p>
              <p className="text-sm font-medium text-slate-700">{insightCount} captured</p>
            </div>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab strip */}
          <div className="border-b border-slate-100 flex">
            {(
              [
                { key: 'transcript', label: 'Transcript', count: transcriptions.length },
                { key: 'insights', label: 'Battle Card', count: insightCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'transcript' ? (
                  transcriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500 mb-1">No transcript yet</p>
                      <p className="text-xs text-slate-400">
                        Transcripts appear here once the session is recorded
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transcriptions.map((t, i) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-shrink-0 pt-0.5">
                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {t.speaker && (
                                <span className="text-xs font-bold text-slate-700">{t.speaker}</span>
                              )}
                              <span className="text-xs text-slate-300">
                                {formatShortTime(t.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{t.text}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : latestCard ? (
                  <div className="space-y-5">
                    {/* Summary */}
                    {latestCard.summary && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
                          Summary
                        </h3>
                        <p className="text-sm text-blue-900 leading-relaxed">{latestCard.summary}</p>
                      </div>
                    )}

                    {/* Insights */}
                    {latestCard.insights.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                          Insights ({latestCard.insights.length})
                        </h3>
                        <div className="space-y-2">
                          {(latestCard.insights as BattleCardInsight[]).map((insight, idx) => {
                            const Icon = INSIGHT_ICONS[insight.type] ?? Lightbulb;
                            const style =
                              PRIORITY_STYLES[insight.priority] ?? PRIORITY_STYLES['low'];
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`border rounded-xl p-4 ${style.bg}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${style.bg.replace('50', '100')}`}>
                                      <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        {insight.type.replace('_', ' ')}
                                      </span>
                                      <span
                                        className={`flex items-center gap-1 text-xs font-semibold ${style.text}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                        {insight.priority}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                      {insight.content}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {latestCard.recommendations.length > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {latestCard.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-emerald-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {battleCards.length > 1 && (
                      <p className="text-xs text-slate-400 text-center">
                        Showing latest battle card · {battleCards.length} total generated
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                      <Lightbulb className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">No insights yet</p>
                    <p className="text-xs text-slate-400">
                      Battle cards are generated during active sessions
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
