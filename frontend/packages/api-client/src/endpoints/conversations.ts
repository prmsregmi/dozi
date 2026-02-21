import { apiClient } from '../client';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: 'meeting' | 'call' | 'interview';
  livekit_room_name: string | null;
  status: 'active' | 'completed' | 'archived';
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationRequest {
  title: string;
  mode: 'meeting' | 'call' | 'interview';
}

export const conversationsApi = {
  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await apiClient.post('/conversations/', data);
    return response.data;
  },

  list: async (limit = 50, offset = 0): Promise<Conversation[]> => {
    const response = await apiClient.get('/conversations/', {
      params: { limit, offset },
    });
    return response.data;
  },

  get: async (conversationId: string): Promise<Conversation> => {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  complete: async (conversationId: string, durationSeconds: number): Promise<Conversation> => {
    const response = await apiClient.patch(`/conversations/${conversationId}/complete`, null, {
      params: { duration_seconds: durationSeconds },
    });
    return response.data;
  },
};
