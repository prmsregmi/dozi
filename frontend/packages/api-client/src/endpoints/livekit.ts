/**
 * LiveKit API endpoints
 * Matches backend routes from: src/dozi/api/routes/livekit.py
 */

import { apiClient } from '../client';

/**
 * Request/Response types matching backend models
 */

export interface CreateRoomRequest {
  room_name: string;
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

export interface DeleteRoomResponse {
  message: string;
}

/**
 * Create a new LiveKit room
 *
 * @param roomName - Name for the room
 * @returns Room details including LiveKit URL
 */
export async function createRoom(roomName: string): Promise<CreateRoomResponse> {
  const response = await apiClient.post<CreateRoomResponse>('/livekit/rooms', {
    room_name: roomName,
  });
  return response.data;
}

/**
 * List all active LiveKit rooms
 *
 * @returns Array of room names
 */
export async function listRooms(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/livekit/rooms');
  return response.data;
}

/**
 * Delete a LiveKit room
 *
 * @param roomName - Name of the room to delete
 * @returns Success message
 */
export async function deleteRoom(roomName: string): Promise<DeleteRoomResponse> {
  const response = await apiClient.delete<DeleteRoomResponse>(`/livekit/rooms/${roomName}`);
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
