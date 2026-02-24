import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationsApi, generateToken, type Conversation } from '@dozi/api-client';
import { useAuthStore } from '../store/authStore';
import { LogOut, Users, Phone, Briefcase, Clock, Settings } from 'lucide-react';

const MODE_CARDS: Array<{
  mode: 'meeting' | 'call' | 'interview';
  label: string;
  description: string;
  icon: typeof Users;
  color: string;
}> = [
  {
    mode: 'meeting',
    label: 'Meeting',
    description: 'Team meetings & group discussions',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    mode: 'interview',
    label: 'Interview',
    description: 'Candidate screening & evaluation',
    icon: Briefcase,
    color: 'bg-purple-500',
  },
  {
    mode: 'call',
    label: 'Sales Call',
    description: 'Client calls & sales pitches',
    icon: Phone,
    color: 'bg-emerald-500',
  },
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomePage() {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'meeting' | 'call' | 'interview'>('meeting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    conversationsApi
      .list()
      .then(setSessions)
      .catch((err) => console.error('[HomePage] Failed to load sessions:', err));
  }, [user]);

  const handleStart = async () => {
    if (!title.trim()) {
      setError('Please enter a session title');
      return;
    }
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const conversation = await conversationsApi.create({ title: title.trim(), mode });

      if (!conversation.livekit_room_name) {
        throw new Error('Failed to initialize session. Please try again.');
      }

      const tokenResponse = await generateToken({
        room_name: conversation.livekit_room_name,
        participant_identity: user.id,
        participant_name: user.email ?? undefined,
      });

      sessionStorage.setItem('livekit_token', tokenResponse.token);
      sessionStorage.setItem('livekit_url', tokenResponse.url);
      sessionStorage.setItem('conversationId', conversation.id);
      sessionStorage.setItem('conversationMode', conversation.mode);
      sessionStorage.setItem('conversationTitle', conversation.title);

      navigate(`/session/${conversation.id}`);
    } catch (err) {
      console.error('[HomePage] Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dozi</h1>
            <p className="text-sm text-slate-500">AI Sales Assistant</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-slate-600">{user.email}</span>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Start New Session */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Start New Session</h2>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Title input */}
            <div className="mb-5">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Session Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sales call with Acme Corp"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            {/* Mode cards */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {MODE_CARDS.map((card) => {
                  const Icon = card.icon;
                  const selected = mode === card.mode;
                  return (
                    <button
                      key={card.mode}
                      type="button"
                      onClick={() => setMode(card.mode)}
                      disabled={loading}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } disabled:opacity-50`}
                    >
                      <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="font-medium text-sm text-slate-900">{card.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{card.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={loading || !title.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Sessions</h2>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {sessions.map((session) => (
                <div key={session.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-900 truncate">
                        {session.title}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.mode === 'meeting'
                          ? 'bg-blue-100 text-blue-700'
                          : session.mode === 'interview'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {session.mode}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDate(session.created_at)} &middot; {formatDuration(session.duration_seconds)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
