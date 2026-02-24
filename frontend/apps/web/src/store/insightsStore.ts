/**
 * Insights and battle card state management with Zustand
 */

import { create } from 'zustand';
import { BattleCard, Insight, AssistMode } from '@dozi/shared';

interface InsightsState {
  // Current battle card data
  battleCard: BattleCard | null;
  mode: AssistMode;

  // Transcript history
  transcripts: Array<{ text: string; timestamp: string }>;

  // Interim transcript (streaming STT preview, not persisted)
  interimText: string | null;

  // Actions
  setBattleCard: (card: BattleCard) => void;
  addInsight: (insight: Insight) => void;
  setMode: (mode: AssistMode) => void;
  addTranscript: (text: string, timestamp: string) => void;
  setInterimText: (text: string | null) => void;
  reset: () => void;
}

const initialState = {
  battleCard: null,
  mode: AssistMode.MEETING,
  transcripts: [],
  interimText: null,
};

export const useInsightsStore = create<InsightsState>((set) => ({
  ...initialState,

  setBattleCard: (card) =>
    set((state) => ({
      battleCard: {
        ...card,
        insights: [
          ...(state.battleCard?.insights ?? []).filter(
            (existing) =>
              !card.insights.some(
                (incoming) =>
                  incoming.type === existing.type && incoming.content === existing.content,
              ),
          ),
          ...card.insights,
        ],
      },
      mode: card.mode,
    })),

  addInsight: (insight) =>
    set((state) => {
      if (!state.battleCard) {
        // Create initial battle card if none exists
        return {
          battleCard: {
            mode: state.mode,
            insights: [insight],
            summary: '',
            recommendations: [],
          },
        };
      }

      // Add insight to existing battle card
      return {
        battleCard: {
          ...state.battleCard,
          insights: [...state.battleCard.insights, insight],
        },
      };
    }),

  setMode: (mode) => set({ mode }),

  addTranscript: (text, timestamp) =>
    set((state) => ({
      transcripts: [...state.transcripts, { text, timestamp }],
      interimText: null, // Clear interim when final arrives
    })),

  setInterimText: (text) => set({ interimText: text }),

  reset: () => set(initialState),
}));
