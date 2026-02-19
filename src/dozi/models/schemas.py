"""Pydantic schemas for request/response models."""

from enum import StrEnum

from pydantic import BaseModel, Field


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
