"""LiveKit Agent that transcribes audio with OpenAI STT + Silero VAD."""

import asyncio
import json
import logging
import traceback

from livekit.agents import Agent, AgentServer, AgentSession, JobContext, JobProcess
from livekit.plugins import openai, silero

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.1,
        min_silence_duration=0.5,
    )


server.setup_fnc = prewarm


async def publish_error(ctx: JobContext, error: Exception, source: str = "agent"):
    """Publish an error to the frontend via the data channel."""
    try:
        payload = json.dumps(
            {
                "source": source,
                "error": str(error),
                "type": type(error).__name__,
                "traceback": traceback.format_exception(error)[-3:],
            }
        )
        await ctx.room.local_participant.publish_data(
            payload.encode("utf-8"),
            topic="agent_error",
            reliable=True,
        )
    except Exception:
        logger.exception("Failed to publish error to frontend")


@server.rtc_session(agent_name="whisper-transcriber")
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    logger.info("Whisper agent joined room: %s", ctx.room.name)

    try:
        # Read STT config from room metadata
        stt_model = "gpt-4o-transcribe"
        vad = ctx.proc.userdata["vad"]

        room_metadata = ctx.room.metadata
        if room_metadata:
            try:
                meta = json.loads(room_metadata)
                if meta.get("stt_model"):
                    stt_model = meta["stt_model"]
                    logger.info("Using STT model from settings: %s", stt_model)

                # Recreate VAD with custom params if provided
                min_silence = meta.get("min_silence_duration")
                min_speech = meta.get("min_speech_duration")
                if min_silence is not None or min_speech is not None:
                    vad = silero.VAD.load(
                        min_speech_duration=min_speech if min_speech is not None else 0.1,
                        min_silence_duration=min_silence if min_silence is not None else 0.5,
                    )
                    logger.info(
                        "Using custom VAD params: min_speech=%.2f, min_silence=%.2f",
                        min_speech or 0.1,
                        min_silence or 0.5,
                    )
            except (json.JSONDecodeError, KeyError):
                logger.warning("Failed to parse room metadata, using defaults")

        session = AgentSession(
            stt=openai.STT(model=stt_model),
            vad=vad,
        )

        @session.on("user_input_transcribed")
        def on_transcript(transcript):
            if transcript.is_final:
                text = transcript.transcript.strip()
                if text:
                    logger.info("Transcription: %s", text)
                    asyncio.create_task(
                        ctx.room.local_participant.publish_data(
                            text.encode("utf-8"),
                            topic="transcription",
                            reliable=True,
                        )
                    )

        await session.start(
            agent=Agent(instructions="You are a transcription assistant."),
            room=ctx.room,
        )
        await ctx.connect()
    except Exception as exc:
        logger.exception("Agent entrypoint failed")
        await publish_error(ctx, exc, source="entrypoint")
        raise


if __name__ == "__main__":
    from livekit import agents

    agents.cli.run_app(server)
