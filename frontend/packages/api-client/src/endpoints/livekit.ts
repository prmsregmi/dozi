/**
 * LiveKit API endpoints
 */

import { apiClient } from '../client';

/**
 * Request/Response types matching backend models
 */

export interface CreateRoomRequest {
  room_name?: string;
  metadata?: Record<string, unknown>;
  dispatch_agent?: boolean;
}

export interface CreateRoomResponse {
  room_name: string;
  url: string;
}

export interface GenerateTokenRequest {
  room_name: string;
  participant_identity: string;
  participant_name?: string;
}

export interface GenerateTokenResponse {
  token: string;
  url: string;
}

/**
 * Create a new LiveKit room
 *
 * @param roomName - Name for the room
 * @returns Room details including LiveKit URL
 */
export async function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
  const response = await apiClient.post<CreateRoomResponse>('/livekit/rooms', request);
  return response.data;
}

/**
 * Generate an access token for a participant
 *
 * @param params - Token generation parameters
 * @returns JWT token and LiveKit URL
 */
export async function generateToken(
  params: GenerateTokenRequest
): Promise<GenerateTokenResponse> {
  const response = await apiClient.post<GenerateTokenResponse>('/livekit/token', {
    room_name: params.room_name,
    participant_identity: params.participant_identity,
    participant_name: params.participant_name,
  });
  return response.data;
}
