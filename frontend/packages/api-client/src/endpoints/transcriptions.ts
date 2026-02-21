import { apiClient } from '../client';

export interface Transcription {
  id: string;
  conversation_id: string;
  text: string;
  speaker: string | null;
  timestamp: string;
  sequence_number: number | null;
}

export interface SaveTranscriptionRequest {
  conversation_id: string;
  text: string;
  speaker?: string;
  sequence_number?: number;
}

export const transcriptionsApi = {
  save: async (data: SaveTranscriptionRequest): Promise<Transcription> => {
    const response = await apiClient.post('/transcriptions/', data);
    return response.data;
  },

  getForConversation: async (conversationId: string): Promise<Transcription[]> => {
    const response = await apiClient.get(`/transcriptions/conversation/${conversationId}`);
    return response.data;
  },
};
