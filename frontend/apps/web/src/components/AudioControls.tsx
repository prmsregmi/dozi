import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useRoomStore } from '../store/roomStore';
import { conversationsApi } from '@dozi/api-client';

interface AudioControlsProps {
  conversationId: string | null;
  startTime: number;
}

function useMicLevel(enabled: boolean) {
  const [level, setLevel] = useState(0);
  const { audioTrack } = useRoomStore();
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || !audioTrack?.mediaStreamTrack) {
      setLevel(0);
      return;
    }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(new MediaStream([audioTrack.mediaStreamTrack]));
    source.connect(analyser);
    ctxRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      setLevel(Math.min(avg / 60, 1)); // normalize: 60 is a reasonable mid-speech avg
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      ctx.close();
    };
  }, [enabled, audioTrack]);

  return level;
}

export default function AudioControls({ conversationId, startTime }: AudioControlsProps) {
  const navigate = useNavigate();
  const { room, isMuted, isPublishing, toggleMute } = useRoomStore();
  const micActive = isPublishing && !isMuted;
  const level = useMicLevel(micActive);

  const handleEndSession = async () => {
    if (conversationId) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      try {
        await conversationsApi.complete(conversationId, durationSeconds);
      } catch (err) {
        console.error('[AudioControls] Failed to complete conversation:', err);
      }
    }

    if (room) {
      await room.disconnect();
    }

    sessionStorage.removeItem('livekit_token');
    sessionStorage.removeItem('livekit_url');
    sessionStorage.removeItem('conversationId');
    sessionStorage.removeItem('conversationMode');
    sessionStorage.removeItem('conversationTitle');

    navigate('/');
  };

  // Scale the ring: 1 = no sound, up to 1.5 at full volume
  const ringScale = micActive ? 1 + level * 0.5 : 1;
  const ringOpacity = micActive ? 0.15 + level * 0.4 : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-slate-200 z-50">
      {/* Mic button with audio level ring */}
      <div className="relative flex items-center justify-center">
        {/* Audio level ring */}
        <div
          className="absolute rounded-full bg-emerald-400 transition-none pointer-events-none"
          style={{
            width: 44,
            height: 44,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        <button
          onClick={() => toggleMute()}
          disabled={!isPublishing}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors z-10 ${
            isMuted
              ? 'bg-slate-800 hover:bg-slate-900 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      <button
        onClick={handleEndSession}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
      >
        <PhoneOff className="w-4 h-4" />
        End Call
      </button>
    </div>
  );
}
