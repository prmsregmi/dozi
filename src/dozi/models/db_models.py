"""Database models for Supabase tables."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from .schemas import AssistMode, Insight


class ConversationCreate(BaseModel):
    """Request to create a new conversation."""

    title: str
    mode: AssistMode


class ConversationResponse(BaseModel):
    """Conversation data from database."""

    id: UUID
    user_id: UUID
    title: str
    mode: str
    livekit_room_name: str | None = None
    status: str = "active"
    duration_seconds: int | None = None
    created_at: datetime
    updated_at: datetime


class TranscriptionCreate(BaseModel):
    """Request to save a transcription."""

    conversation_id: UUID
    text: str
    speaker: str | None = None
    sequence_number: int | None = None


class TranscriptionResponse(BaseModel):
    """Transcription data from database."""

    id: UUID
    conversation_id: UUID
    text: str
    speaker: str | None
    timestamp: datetime
    sequence_number: int | None


class BattleCardCreate(BaseModel):
    """Request to save a battle card."""

    conversation_id: UUID
    insights: list[Insight]
    summary: str
    recommendations: list[str]


class BattleCardResponse(BaseModel):
    """Battle card data from database."""

    id: UUID
    conversation_id: UUID
    insights: list[Insight]
    summary: str
    recommendations: list[str]
    created_at: datetime


class UserPreferencesResponse(BaseModel):
    """User preferences data."""

    user_id: UUID
    default_mode: str = "meeting"
    settings: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class UserPreferencesUpdate(BaseModel):
    """Update user preferences."""

    default_mode: str | None = None
    settings: dict | None = None
