/**
 * Listens for error/log messages published by the LiveKit agent
 * and surfaces them in the browser console.
 */

import { useEffect } from 'react';
import { Room, RoomEvent } from 'livekit-client';

export function useAgentLogs(room: Room | null) {
  useEffect(() => {
    if (!room) return;

    const handleData = (
      payload: Uint8Array,
      participant: { identity?: string } | undefined,
      _kind: unknown,
      topic: string | undefined,
    ) => {
      if (topic !== 'agent_error') return;

      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        console.error(
          `[Agent Error] ${data.type}: ${data.error}`,
          '\n  source:', data.source,
          '\n  traceback:', data.traceback?.join(''),
          '\n  from:', participant?.identity,
        );
      } catch {
        // Fallback if payload isn't JSON
        const text = new TextDecoder().decode(payload);
        console.error('[Agent Error]', text);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);
}
