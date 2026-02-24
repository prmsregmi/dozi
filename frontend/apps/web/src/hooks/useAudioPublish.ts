/**
 * Audio publishing hook
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { Room, RoomEvent, Track, LocalAudioTrack, createLocalAudioTrack } from 'livekit-client';
import { useRoomStore } from '../store/roomStore';

interface UseAudioPublishParams {
  room: Room | null;
  enabled?: boolean;
}

export function useAudioPublish({ room, enabled = true }: UseAudioPublishParams) {
  const { setAudioTrack, setPublishing } = useRoomStore();
  const [error, setError] = useState<string | null>(null);
  const trackRef = useRef<LocalAudioTrack | null>(null);

  const publishAudio = useCallback(async () => {
    if (!room || !enabled || room.state !== 'connected') {
      console.log('[Audio] publishAudio skipped — room:', room?.state, 'enabled:', enabled);
      return;
    }

    try {
      setError(null);

      // Stop and clean up any existing track first
      if (trackRef.current) {
        try {
          await room.localParticipant.unpublishTrack(trackRef.current);
        } catch { /* ignore */ }
        trackRef.current.stop();
        trackRef.current = null;
        setAudioTrack(null);
      }

      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      trackRef.current = track;
      setAudioTrack(track);

      await room.localParticipant.publishTrack(track, {
        name: 'microphone',
        source: Track.Source.Microphone,
      });

      setPublishing(true);
      console.log('[Audio] Track published successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to publish audio';
      console.error('[Audio] Failed to publish:', err);
      setError(errorMsg);
      setPublishing(false);

      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null;
        setAudioTrack(null);
      }
    }
  }, [room, enabled, setPublishing, setAudioTrack]);

  const unpublishAudio = useCallback(async () => {
    if (!room || !trackRef.current) return;

    try {
      await room.localParticipant.unpublishTrack(trackRef.current);
      trackRef.current.stop();
      trackRef.current = null;
      setAudioTrack(null);
      setPublishing(false);
    } catch (err) {
      console.error('[Audio] Failed to unpublish:', err);
    }
  }, [room, setAudioTrack, setPublishing]);

  // Publish on connect
  useEffect(() => {
    if (!room || !enabled || room.state !== 'connected') return;
    if (trackRef.current) return;

    const timer = setTimeout(() => {
      publishAudio();
    }, 500);

    return () => clearTimeout(timer);
  }, [room, enabled, publishAudio]);

  // Re-publish after LiveKit internally reconnects (e.g. region change)
  useEffect(() => {
    if (!room) return;

    const handleReconnected = async () => {
      console.log('[Audio] Room reconnected — re-publishing audio track');
      // Force re-publish by clearing the track ref
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null;
        setAudioTrack(null);
        setPublishing(false);
      }
      await publishAudio();
    };

    room.on(RoomEvent.Reconnected, handleReconnected);
    return () => {
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room, publishAudio, setAudioTrack, setPublishing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null;
      }
    };
  }, []);

  return {
    error,
    publishAudio,
    unpublishAudio,
  };
}
