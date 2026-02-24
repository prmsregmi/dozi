import { apiClient } from '../client';
import type { PromptOverride } from './preferences';

export interface Insight {
  type: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

export interface BattleCardResult {
  mode: string;
  insights: Insight[];
  summary: string;
  recommendations: string[];
}

export interface LLMSettings {
  llm_model?: string;
  temperature?: number;
  prompt_overrides?: Record<string, PromptOverride> | null;
}

export interface GenerateBattleCardRequest {
  transcript: string;
  mode: string;
  user_settings?: LLMSettings;
}

export const battlecardsApi = {
  generate: async (data: GenerateBattleCardRequest): Promise<BattleCardResult> => {
    const response = await apiClient.post('/battlecards/generate', data, {
      timeout: 60000,
    });
    return response.data;
  },
};
