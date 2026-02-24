import { useEffect, useRef, useCallback } from 'react';
import { battlecardsApi, type LLMSettings } from '@dozi/api-client';
import { getPreferences, saveBattleCard } from '../lib/db';
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
  const llmSettingsRef = useRef<LLMSettings>({});
  const settingsLoadedRef = useRef(false);

  // Load user settings on mount
  useEffect(() => {
    getPreferences()
      .then((prefs) => {
        if (prefs?.settings) {
          const s = prefs.settings as Record<string, unknown>;
          if (typeof s.transcript_batch_size === 'number') batchSizeRef.current = s.transcript_batch_size;
          if (typeof s.generation_interval_seconds === 'number') intervalMsRef.current = s.generation_interval_seconds * 1000;
          if (typeof s.llm_model === 'string') llmSettingsRef.current.llm_model = s.llm_model;
          if (typeof s.temperature === 'number') llmSettingsRef.current.temperature = s.temperature;
          if ('prompt_overrides' in s) llmSettingsRef.current.prompt_overrides = s.prompt_overrides as LLMSettings['prompt_overrides'];
        }
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
    const currentMode = useInsightsStore.getState().mode;
    const userSettings = Object.keys(llmSettingsRef.current).length > 0
      ? llmSettingsRef.current
      : undefined;

    battlecardsApi
      .generate({ transcript: fullTranscript, mode: currentMode, user_settings: userSettings })
      .then((card) => {
        setBattleCard({
          mode: card.mode as typeof currentMode,
          insights: card.insights,
          summary: card.summary,
          recommendations: card.recommendations,
        });
        lastGenCountRef.current = currentTranscripts.length;
        lastGenTimeRef.current = Date.now();
        // Fire-and-forget persistence
        saveBattleCard({
          conversationId,
          insights: card.insights,
          summary: card.summary,
          recommendations: card.recommendations,
        }).catch((err) => console.error('[BattleCard] Failed to save:', err));
      })
      .catch((err) => {
        console.error('[BattleCard] Generation failed:', err);
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
