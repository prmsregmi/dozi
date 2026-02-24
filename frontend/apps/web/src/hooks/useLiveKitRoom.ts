/**
 * LiveKit room connection hook
 */

import { useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, ConnectionState as LKConnectionState, RemoteParticipant } from 'livekit-client';
import { useRoomStore, ConnectionState } from '../store/roomStore';

interface UseLiveKitRoomParams {
  token: string;
  serverUrl: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function useLiveKitRoom({
  token,
  serverUrl,
  onConnected,
  onDisconnected,
  onError,
}: UseLiveKitRoomParams) {
  const { room, setRoom, setConnectionState, setError, setAgentReady } = useRoomStore();
  // Use a ref to track the current room so connect/disconnect don't have
  // stale closures — this also prevents double-connect issues.
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);

  const mapConnectionState = useCallback((state: LKConnectionState): ConnectionState => {
    switch (state) {
      case LKConnectionState.Connected:
        return ConnectionState.CONNECTED;
      case LKConnectionState.Connecting:
        return ConnectionState.CONNECTING;
      case LKConnectionState.Reconnecting:
        return ConnectionState.RECONNECTING;
      case LKConnectionState.Disconnected:
        return ConnectionState.DISCONNECTED;
      default:
        return ConnectionState.DISCONNECTED;
    }
  }, []);

  const setupEventListeners = useCallback(
    (r: Room) => {
      r.on(RoomEvent.ConnectionStateChanged, (state: LKConnectionState) => {
        setConnectionState(mapConnectionState(state));
        if (state === LKConnectionState.Connected) {
          onConnected?.();
        } else if (state === LKConnectionState.Disconnected) {
          onDisconnected?.();
        }
      });

      r.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        // Agent identities start with "agent-"
        if (participant.identity.startsWith('agent-')) {
          console.log('[LiveKit] Agent joined:', participant.identity);
          setAgentReady(true);
        }
      });

      r.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (participant.identity.startsWith('agent-')) {
          console.log('[LiveKit] Agent left:', participant.identity);
          setAgentReady(false);
        }
      });

      r.on(RoomEvent.Reconnecting, () => {
        console.log('[LiveKit] Reconnecting...');
        setConnectionState(ConnectionState.RECONNECTING);
      });

      r.on(RoomEvent.Reconnected, () => {
        console.log('[LiveKit] Reconnected to room:', r.name, '| participants:', r.remoteParticipants.size);
        setConnectionState(ConnectionState.CONNECTED);
        setError(null);
      });

      r.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.DISCONNECTED);
        onDisconnected?.();
      });
    },
    [setConnectionState, setError, mapConnectionState, onConnected, onDisconnected]
  );

  const connect = useCallback(async () => {
    if (connectingRef.current) return;
    if (roomRef.current?.state === 'connected') return;

    connectingRef.current = true;

    // Disconnect any existing room first
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    try {
      const newRoom = new Room({
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        adaptiveStream: true,
        dynacast: true,
      });

      setupEventListeners(newRoom);
      setConnectionState(ConnectionState.CONNECTING);

      await newRoom.connect(serverUrl, token);

      roomRef.current = newRoom;
      setRoom(newRoom);
      setConnectionState(ConnectionState.CONNECTED);
      setError(null);
      console.log('[LiveKit] Connected to room:', newRoom.name, '| participants:', newRoom.remoteParticipants.size);

      // Check if agent is already in the room
      for (const [, participant] of newRoom.remoteParticipants) {
        if (participant.identity.startsWith('agent-')) {
          console.log('[LiveKit] Agent already present:', participant.identity);
          setAgentReady(true);
          break;
        }
      }

      onConnected?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[LiveKit] Connection failed:', error);
      setConnectionState(ConnectionState.DISCONNECTED);
      setError(error.message);
      onError?.(error);
    } finally {
      connectingRef.current = false;
    }
  }, [token, serverUrl, setupEventListeners, setRoom, setConnectionState, setError, onConnected, onError]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      setConnectionState(ConnectionState.DISCONNECTING);
      await roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setConnectionState(ConnectionState.DISCONNECTED);
    }
  }, [setRoom, setConnectionState]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [token, serverUrl]);

  return {
    room,
    connect,
    disconnect,
  };
}
