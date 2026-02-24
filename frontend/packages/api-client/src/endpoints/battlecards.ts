import { apiClient } from '../client';

export interface BattleCard {
  id: string;
  conversation_id: string;
  insights: Array<{
    type: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  summary: string;
  recommendations: string[];
  created_at: string;
}

export interface GenerateBattleCardRequest {
  conversation_id: string;
  transcript?: string;
}

export const battlecardsApi = {
  generate: async (data: GenerateBattleCardRequest): Promise<BattleCard> => {
    const response = await apiClient.post('/battlecards/generate', data, {
      timeout: 60000, // LLM generation can take longer than default
    });
    return response.data;
  },

  getForConversation: async (conversationId: string): Promise<BattleCard[]> => {
    const response = await apiClient.get(`/battlecards/conversation/${conversationId}`);
    return response.data;
  },
};
