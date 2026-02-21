/**
 * LiveKit related types
 */

/**
 * Room creation request
 */
export interface CreateRoomRequest {
  room_name: string;
}

/**
 * Room creation response
 */
export interface CreateRoomResponse {
  room_name: string;
  created: boolean;
}

/**
 * Token generation request
 */
export interface TokenRequest {
  room_name: string;
  identity: string;
  name?: string;
}

/**
 * Token generation response
 */
export interface TokenResponse {
  token: string;
  url: string;
}

/**
 * Room deletion response
 */
export interface DeleteRoomResponse {
  deleted: boolean;
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting',
}
