import { apiClient } from '../client';

export interface PromptOverride {
  system_message: string | null;
  user_message: string | null;
}

export interface UserSettings {
  stt_model: string;
  min_silence_duration: number;
  min_speech_duration: number;
  llm_model: string;
  transcript_batch_size: number;
  generation_interval_seconds: number;
  temperature: number;
  prompt_overrides: Record<string, PromptOverride> | null;
}

/** Non-model defaults owned by the frontend. Model names always come from GET /models. */
export const APP_SETTINGS_DEFAULTS: Omit<UserSettings, 'stt_model' | 'llm_model'> = {
  min_silence_duration: 0.5,
  min_speech_duration: 0.1,
  transcript_batch_size: 1,
  generation_interval_seconds: 5,
  temperature: 0.3,
  prompt_overrides: null,
};

export interface PromptTemplate {
  system_message: string;
  user_message: string;
}

export interface ModelEntry {
  model: string;
  provider: string;
  name: string;
}

export interface ModelRegistry {
  stt: ModelEntry[];
  llm: ModelEntry[];
  defaults: {
    stt_model: string;
    llm_model: string;
  };
}

export const preferencesApi = {
  getModels: async (): Promise<ModelRegistry> => {
    const response = await apiClient.get('/models');
    return response.data;
  },

  getPromptDefaults: async (): Promise<Record<string, PromptTemplate>> => {
    const response = await apiClient.get('/prompts/defaults');
    return response.data;
  },
};
