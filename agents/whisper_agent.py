"""Simple LiveKit Agent that transcribes audio with Whisper and sends text to backend."""

import logging

from livekit import agents
from livekit.plugins import openai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def entrypoint(ctx: agents.JobContext):
    """
    Main agent entry point - transcribes audio and publishes text to room.

    This agent:
    1. Joins the LiveKit room
    2. Captures audio from participants
    3. Transcribes using OpenAI Whisper
    4. Publishes text to room (backend receives it)
    """
    # Connect to the LiveKit room
    await ctx.connect()
    logger.info(f"Whisper agent joined room: {ctx.room.name}")

    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Processing audio from participant: {participant.identity}")

    # Initialize OpenAI Whisper for transcription
    stt = openai.STT(model="whisper-1")

    # Stream audio and get transcriptions
    async for event in stt.stream():
        if event.type == agents.stt.SpeechEventType.FINAL_TRANSCRIPT:
            # Get the transcribed text
            text = event.alternatives[0].text
            logger.info(f"Transcription: {text}")

            # Publish text to room (backend will receive this)
            await ctx.room.local_participant.publish_data(
                text.encode("utf-8"),
                topic="transcription",  # Backend listens to this topic
                reliable=True,  # Ensure delivery
            )
            logger.info(f"Published transcription to room: {text[:50]}...")


if __name__ == "__main__":
    # Run the agent using LiveKit's CLI
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
