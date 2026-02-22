/**
 * Room state management with Zustand
 */

import { create } from 'zustand';
import { Room, LocalAudioTrack } from 'livekit-client';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting',
}

interface RoomState {
  // Room details
  roomName: string | null;
  room: Room | null;
  connectionState: ConnectionState;
  error: string | null;
  livekitUrl: string | null;

  // Audio state
  audioTrack: LocalAudioTrack | null;
  isMuted: boolean;
  isPublishing: boolean;

  // Actions
  setRoomName: (name: string) => void;
  setRoom: (room: Room | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  setLivekitUrl: (url: string) => void;
  setAudioTrack: (track: LocalAudioTrack | null) => void;
  setMuted: (muted: boolean) => void;
  setPublishing: (publishing: boolean) => void;
  toggleMute: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  roomName: null,
  room: null,
  connectionState: ConnectionState.DISCONNECTED,
  error: null,
  livekitUrl: null,
  audioTrack: null,
  isMuted: false,
  isPublishing: false,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,

  setRoomName: (name) => set({ roomName: name }),

  setRoom: (room) => set({ room }),

  setConnectionState: (state) => set({ connectionState: state }),

  setError: (error) => set({ error }),

  setLivekitUrl: (url) => set({ livekitUrl: url }),

  setAudioTrack: (track) => set({ audioTrack: track }),

  setMuted: (muted) => set({ isMuted: muted }),

  setPublishing: (publishing) => set({ isPublishing: publishing }),

  toggleMute: async () => {
    const { audioTrack, isMuted } = get();
    if (!audioTrack) {
      console.error('[Audio] No audio track available');
      return;
    }

    try {
      const newMutedState = !isMuted;
      if (newMutedState) {
        await audioTrack.mute();
      } else {
        await audioTrack.unmute();
      }
      set({ isMuted: newMutedState });
    } catch (err) {
      console.error('[Audio] Failed to toggle mute:', err);
    }
  },

  reset: () => set(initialState),
}));
