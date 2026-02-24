"""Pydantic schemas for request/response models."""

from enum import StrEnum

from pydantic import BaseModel, Field

from ..settings import LLM_DEFAULT, STT_DEFAULT


class AssistMode(StrEnum):
    """Mode of conversation assistance."""

    MEETING = "meeting"
    CALL = "call"
    INTERVIEW = "interview"


class TranscriptionRequest(BaseModel):
    """Request model for audio transcription."""

    audio_data: str = Field(..., description="Base64 encoded audio data")
    mode: AssistMode = Field(default=AssistMode.MEETING, description="Assistance mode")


class TranscriptionResponse(BaseModel):
    """Response model for transcription."""

    transcript: str = Field(..., description="Transcribed text")
    timestamp: str = Field(..., description="Timestamp of transcription")


class Insight(BaseModel):
    """Individual insight or suggestion."""

    type: str = Field(..., description="Type of insight (key_point, objection, suggestion, etc.)")
    content: str = Field(..., description="The insight content")
    priority: str = Field(default="medium", description="Priority level: low, medium, high")


class BattleCard(BaseModel):
    """Battle card with conversation insights and suggestions."""

    mode: AssistMode = Field(..., description="Mode of assistance")
    insights: list[Insight] = Field(default_factory=list, description="List of insights")
    summary: str = Field(..., description="Overall summary of the conversation so far")
    recommendations: list[str] = Field(default_factory=list, description="Action recommendations")


class PromptOverride(BaseModel):
    """Per-mode prompt override. None values mean use the default YAML prompt."""

    system_message: str | None = None
    user_message: str | None = None


class UserSettings(BaseModel):
    """User-configurable settings stored in the user_preferences JSONB column."""

    # Transcription
    stt_model: str = STT_DEFAULT
    min_silence_duration: float = Field(default=0.5, ge=0.2, le=1.0)
    min_speech_duration: float = Field(default=0.1, ge=0.05, le=0.5)

    # Battle card generation
    llm_model: str = LLM_DEFAULT
    transcript_batch_size: int = Field(default=1, ge=1, le=10)
    generation_interval_seconds: int = Field(default=5, ge=5, le=120)
    temperature: float = Field(default=0.3, ge=0.0, le=1.0)

    # Prompt overrides (per mode) — None means use default YAML
    prompt_overrides: dict[str, PromptOverride] | None = None
