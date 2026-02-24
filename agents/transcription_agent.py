"""LiveKit Agent that transcribes audio with configurable STT (OpenAI/Deepgram) + Silero VAD."""

import asyncio
import json
import logging
import os
import traceback

import httpx
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, JobProcess
from livekit.plugins import openai, silero

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fetch model registry from LLM service at startup
# ---------------------------------------------------------------------------

_LLM_SERVICE_URL = os.environ.get("LLM_SERVICE_URL", "http://localhost:8000")

try:
    _resp = httpx.get(f"{_LLM_SERVICE_URL}/models", timeout=10)
    _resp.raise_for_status()
    _registry = _resp.json()
    _STT_DEFAULT_MODEL: str = _registry["defaults"]["stt_model"]
    _STT_PROVIDERS: dict[str, str] = {e["model"]: e["provider"] for e in _registry.get("stt", [])}
    _STT_DEFAULT_PROVIDER: str = _STT_PROVIDERS[_STT_DEFAULT_MODEL]
    logger.info("Loaded model registry from LLM service — default STT: %s", _STT_DEFAULT_MODEL)
except Exception as exc:
    logger.exception("Failed to fetch model registry from %s — cannot start.", _LLM_SERVICE_URL)
    raise SystemExit(1) from exc

# ---------------------------------------------------------------------------

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


def _build_stt(provider: str, model: str):
    """Build the STT plugin based on provider config."""
    if provider == "deepgram":
        from livekit.plugins import deepgram

        logger.info("Using Deepgram STT with model: %s", model)
        return deepgram.STT(model=model)

    # Default: OpenAI
    logger.info("Using OpenAI STT with model: %s", model)
    return openai.STT(model=model)


@server.rtc_session(agent_name="transcriber")
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    logger.info("Transcription agent joined room: %s", ctx.room.name)

    try:
        stt_provider = _STT_DEFAULT_PROVIDER
        stt_model = _STT_DEFAULT_MODEL
        vad = ctx.proc.userdata["vad"]

        room_metadata = ctx.room.metadata
        if room_metadata:
            try:
                meta = json.loads(room_metadata)
                if meta.get("stt_provider"):
                    stt_provider = meta["stt_provider"]
                if meta.get("stt_model"):
                    stt_model = meta["stt_model"]
                    logger.info("Using STT model from room metadata: %s", stt_model)

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

        await ctx.connect()

        stt = _build_stt(stt_provider, stt_model)

        session = AgentSession(
            stt=stt,
            vad=vad,
        )

        is_streaming = stt_provider == "deepgram"

        @session.on("user_input_transcribed")
        def on_transcript(transcript):
            if is_streaming and not transcript.is_final:
                text = transcript.transcript.strip()
                if text:
                    asyncio.create_task(
                        ctx.room.local_participant.publish_data(
                            text.encode("utf-8"),
                            topic="transcription_interim",
                            reliable=False,
                        )
                    )
                return

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
    except Exception as exc:
        logger.exception("Agent entrypoint failed")
        await publish_error(ctx, exc, source="entrypoint")
        raise


if __name__ == "__main__":
    from livekit import agents

    agents.cli.run_app(server)
