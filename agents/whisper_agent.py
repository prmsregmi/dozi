"""LiveKit Agent that transcribes audio with Whisper via VAD + StreamAdapter."""

import asyncio
import logging

from livekit import agents, rtc
from livekit.agents import AgentServer
from livekit.plugins import openai, silero

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    logger.info("Whisper agent joined room: %s", ctx.room.name)

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(transcribe_track(ctx, track))

    async def transcribe_track(ctx: agents.JobContext, track: rtc.Track):
        whisper_stt = openai.STT(model="whisper-1")
        vad = silero.VAD.load(min_speech_duration=0.1, min_silence_duration=0.5)
        stt = agents.stt.StreamAdapter(whisper_stt, vad.stream())
        stt_stream = stt.stream()
        audio_stream = rtc.AudioStream(track)

        async with asyncio.TaskGroup() as tg:
            tg.create_task(publish_transcriptions(ctx, stt_stream))
            async for event in audio_stream:
                stt_stream.push_frame(event.frame)
            stt_stream.end_input()

    async def publish_transcriptions(ctx: agents.JobContext, stream: agents.stt.SpeechStream):
        async for event in stream:
            if event.type == agents.stt.SpeechEventType.FINAL_TRANSCRIPT:
                text = event.alternatives[0].text.strip()
                if text:
                    logger.info("Transcription: %s", text)
                    await ctx.room.local_participant.publish_data(
                        text.encode("utf-8"),
                        topic="transcription",
                        reliable=True,
                    )


if __name__ == "__main__":
    agents.cli.run_app(server)
