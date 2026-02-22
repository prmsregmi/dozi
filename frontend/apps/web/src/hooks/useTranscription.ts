import { useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { transcriptionsApi } from '@dozi/api-client';
import { useInsightsStore } from '../store/insightsStore';

export function useTranscription(room: Room | null, conversationId: string | null) {
  const addTranscript = useInsightsStore((state) => state.addTranscript);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!room || !conversationId) return;
    console.log('[Transcription] Listening for data on room:', room.name);

    const handleData = (
      payload: Uint8Array,
      participant: { identity?: string } | undefined,
      _kind: unknown,
      topic: string | undefined,
    ) => {
      console.log('[Transcription] DataReceived topic:', topic, 'from:', participant?.identity);
      if (topic !== 'transcription') return;

      const text = new TextDecoder().decode(payload);
      console.log('[Transcription] Text:', text);
      if (!text.trim()) return;

      const timestamp = new Date().toISOString();
      sequenceRef.current += 1;

      addTranscript(text, timestamp);

      transcriptionsApi
        .save({
          conversation_id: conversationId,
          text,
          speaker: participant?.identity,
          sequence_number: sequenceRef.current,
        })
        .catch((err) => console.error('[Transcription] Failed to save:', err));
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, conversationId, addTranscript]);
}
