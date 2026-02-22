import { useEffect, useRef, useCallback } from 'react';
import { battlecardsApi } from '@dozi/api-client';
import { useInsightsStore } from '../store/insightsStore';

const TRANSCRIPT_BATCH_SIZE = 3;
const GENERATION_INTERVAL_MS = 30_000;

export function useBattleCardGenerator(conversationId: string | null) {
  const transcripts = useInsightsStore((state) => state.transcripts);
  const setBattleCard = useInsightsStore((state) => state.setBattleCard);
  const lastGenCountRef = useRef(0);
  const lastGenTimeRef = useRef(0);
  const generatingRef = useRef(false);

  const tryGenerate = useCallback(() => {
    const currentTranscripts = useInsightsStore.getState().transcripts;
    if (!conversationId || currentTranscripts.length === 0 || generatingRef.current) return;

    const newSinceLastGen = currentTranscripts.length - lastGenCountRef.current;
    const timeSinceLastGen = Date.now() - lastGenTimeRef.current;
    const shouldGenerate =
      newSinceLastGen >= TRANSCRIPT_BATCH_SIZE ||
      (newSinceLastGen > 0 && timeSinceLastGen >= GENERATION_INTERVAL_MS);

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
      .catch((err) => console.error('[BattleCard] Generation failed:', err))
      .finally(() => {
        generatingRef.current = false;
      });
  }, [conversationId, setBattleCard]);

  // Trigger on new transcripts
  useEffect(() => {
    tryGenerate();
  }, [transcripts.length, tryGenerate]);

  // Timer-based trigger for the 30-second interval
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      tryGenerate();
    }, GENERATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId, tryGenerate]);
}
