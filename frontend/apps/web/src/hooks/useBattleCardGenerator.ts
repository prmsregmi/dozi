import { useEffect, useRef, useCallback } from 'react';
import { battlecardsApi, preferencesApi } from '@dozi/api-client';
import { useInsightsStore } from '../store/insightsStore';

const DEFAULT_BATCH_SIZE = 1;
const DEFAULT_INTERVAL_MS = 5_000;

export function useBattleCardGenerator(conversationId: string | null) {
  const transcripts = useInsightsStore((state) => state.transcripts);
  const setBattleCard = useInsightsStore((state) => state.setBattleCard);
  const lastGenCountRef = useRef(0);
  const lastGenTimeRef = useRef(0);
  const generatingRef = useRef(false);
  const batchSizeRef = useRef(DEFAULT_BATCH_SIZE);
  const intervalMsRef = useRef(DEFAULT_INTERVAL_MS);
  const settingsLoadedRef = useRef(false);

  // Load user settings on mount
  useEffect(() => {
    preferencesApi
      .get()
      .then((prefs) => {
        const s = prefs.settings;
        if (s.transcript_batch_size) batchSizeRef.current = s.transcript_batch_size;
        if (s.generation_interval_seconds) intervalMsRef.current = s.generation_interval_seconds * 1000;
        settingsLoadedRef.current = true;
      })
      .catch(() => {
        settingsLoadedRef.current = true;
      });
  }, []);

  const tryGenerate = useCallback(() => {
    const currentTranscripts = useInsightsStore.getState().transcripts;
    if (!conversationId || currentTranscripts.length === 0 || generatingRef.current) return;

    const newSinceLastGen = currentTranscripts.length - lastGenCountRef.current;
    const timeSinceLastGen = Date.now() - lastGenTimeRef.current;
    const shouldGenerate =
      newSinceLastGen >= batchSizeRef.current ||
      (newSinceLastGen > 0 && timeSinceLastGen >= intervalMsRef.current);

    if (!shouldGenerate) return;

    generatingRef.current = true;
    const fullTranscript = currentTranscripts.map((t) => t.text).join('\n');

    battlecardsApi
      .generate({ conversation_id: conversationId, transcript: fullTranscript })
      .then((card) => {
        const currentMode = useInsightsStore.getState().mode;
        setBattleCard({
          mode: currentMode,
          insights: card.insights.map((i) => ({
            type: i.type,
            content: i.content,
            priority: i.priority,
          })),
          summary: card.summary,
          recommendations: card.recommendations,
        });
        lastGenCountRef.current = currentTranscripts.length;
        lastGenTimeRef.current = Date.now();
      })
      .catch((err) => {
        console.error('[BattleCard] Generation failed:', err);
        // Still update time so we don't immediately retry on failure
        lastGenTimeRef.current = Date.now();
      })
      .finally(() => {
        generatingRef.current = false;
      });
  }, [conversationId, setBattleCard]);

  // Trigger on new transcripts
  useEffect(() => {
    tryGenerate();
  }, [transcripts.length, tryGenerate]);

  // Timer-based trigger using user-configured interval
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      tryGenerate();
    }, intervalMsRef.current);

    return () => clearInterval(interval);
  }, [conversationId, tryGenerate]);
}
