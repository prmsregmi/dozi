import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { useAudioPublish } from '../hooks/useAudioPublish';
import { useTranscription } from '../hooks/useTranscription';
import { useAgentLogs } from '../hooks/useAgentLogs';
import { useBattleCardGenerator } from '../hooks/useBattleCardGenerator';
import { useRoomStore, ConnectionState } from '../store/roomStore';
import { useInsightsStore } from '../store/insightsStore';
import { AssistMode } from '@dozi/shared';
import AudioControls from '../components/AudioControls';
import InsightsPanel from '../components/InsightsPanel';
import TranscriptView from '../components/TranscriptView';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function SessionPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const connectionState = useRoomStore((state) => state.connectionState);
  const error = useRoomStore((state) => state.error);
  const reset = useRoomStore((state) => state.reset);
  const isPublishing = useRoomStore((state) => state.isPublishing);
  const agentReady = useRoomStore((state) => state.agentReady);
  const resetInsights = useInsightsStore((state) => state.reset);
  const setMode = useInsightsStore((state) => state.setMode);

  const token = sessionStorage.getItem('livekit_token');
  const serverUrl = sessionStorage.getItem('livekit_url');
  const conversationTitle = sessionStorage.getItem('conversationTitle') || 'Session';
  const conversationMode = sessionStorage.getItem('conversationMode') || 'meeting';

  // Duration timer — starts when the agent is ready
  const startTimeRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!agentReady) return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [agentReady]);

  // Sync conversation mode to insights store
  useEffect(() => {
    if (conversationMode && Object.values(AssistMode).includes(conversationMode as AssistMode)) {
      setMode(conversationMode as AssistMode);
    }
  }, [conversationMode, setMode]);

  // Redirect if no token
  useEffect(() => {
    if (!token || !serverUrl) {
      navigate('/');
    }
  }, [token, serverUrl, navigate]);

  // Connect to LiveKit room
  const { room } = useLiveKitRoom({
    token: token || '',
    serverUrl: serverUrl || '',
  });

  // Publish audio only after the agent has joined
  useAudioPublish({
    room,
    enabled: connectionState === ConnectionState.CONNECTED && agentReady,
  });

  // Listen for transcriptions from the data channel
  useTranscription(room, conversationId ?? null);

  // Surface agent errors in the browser console
  useAgentLogs(room);

  // Auto-generate battle cards
  useBattleCardGenerator(conversationId ?? null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
      resetInsights();
    };
  }, [reset, resetInsights]);

  if (connectionState === ConnectionState.CONNECTING) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (connectionState === ConnectionState.CONNECTED && !agentReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Waiting for transcription agent to join...</p>
          <p className="text-slate-400 text-xs mt-1">Your microphone will activate once the agent is ready</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const modeBadgeColor =
    conversationMode === 'meeting'
      ? 'bg-blue-100 text-blue-700'
      : conversationMode === 'interview'
        ? 'bg-purple-100 text-purple-700'
        : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">{conversationTitle}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${modeBadgeColor}`}>
              {conversationMode}
            </span>
            {isPublishing && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-slate-500">{formatElapsed(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <main className="flex-1 container mx-auto px-6 py-5 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[calc(100vh-80px-5rem)]">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <TranscriptView />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <InsightsPanel />
          </div>
        </div>
      </main>

      {/* Floating call controls */}
      <AudioControls conversationId={conversationId ?? null} startTime={startTimeRef.current} />
    </div>
  );
}
