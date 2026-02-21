/**
 * TypeScript types matching backend Pydantic schemas
 * Source: /src/dozi/models/schemas.py
 */

/**
 * Mode of conversation assistance
 */
export enum AssistMode {
  MEETING = 'meeting',
  CALL = 'call',
  INTERVIEW = 'interview',
}

/**
 * Priority level for insights
 */
export type InsightPriority = 'low' | 'medium' | 'high';

/**
 * Types of insights that can be generated
 */
export type InsightType = 'key_point' | 'objection' | 'suggestion' | 'question' | 'action_item';

/**
 * Individual insight or suggestion
 */
export interface Insight {
  type: string;
  content: string;
  priority: InsightPriority;
}

/**
 * Battle card with conversation insights and suggestions
 */
export interface BattleCard {
  mode: AssistMode;
  insights: Insight[];
  summary: string;
  recommendations: string[];
}

/**
 * Request model for audio transcription
 */
export interface TranscriptionRequest {
  audio_data: string; // Base64 encoded audio data
  mode: AssistMode;
}

/**
 * Response model for transcription
 */
export interface TranscriptionResponse {
  transcript: string;
  timestamp: string;
}
