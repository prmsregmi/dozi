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

export interface UserPreferences {
  user_id: string;
  default_mode: string;
  settings: Partial<UserSettings>;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  system_message: string;
  user_message: string;
}

export interface AppConfig {
  granular_settings: boolean;
}

export interface ModelEntry {
  model: string;
  provider: string;
  name: string;
}

export interface ModelRegistry {
  stt: ModelEntry[];
  llm: ModelEntry[];
  defaults: UserSettings;
}

export const preferencesApi = {
  getConfig: async (): Promise<AppConfig> => {
    const response = await apiClient.get('/preferences/config');
    return response.data;
  },

  get: async (): Promise<UserPreferences> => {
    const response = await apiClient.get('/preferences/');
    return response.data;
  },

  update: async (settings: Partial<UserSettings>): Promise<UserPreferences> => {
    const response = await apiClient.patch('/preferences/', { settings });
    return response.data;
  },

  getModels: async (): Promise<ModelRegistry> => {
    const response = await apiClient.get('/preferences/models');
    return response.data;
  },

  getPromptDefaults: async (): Promise<Record<string, PromptTemplate>> => {
    const response = await apiClient.get('/preferences/prompt-defaults');
    return response.data;
  },
};
