"""Transcription endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status

from supabase import AsyncClient

from ...auth import get_supabase
from ...models.db_models import TranscriptionCreate, TranscriptionResponse
from ...repositories import TranscriptionRepository

router = APIRouter(prefix="/transcriptions", tags=["transcriptions"])


@router.post("/", response_model=TranscriptionResponse, status_code=status.HTTP_201_CREATED)
async def save_transcription(
    data: TranscriptionCreate,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Save a transcription to the database."""
    trans_repo = TranscriptionRepository(supabase)
    return await trans_repo.create(data)


@router.get("/conversation/{conversation_id}", response_model=list[TranscriptionResponse])
async def get_transcriptions(
    conversation_id: UUID,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Get all transcriptions for a conversation."""
    trans_repo = TranscriptionRepository(supabase)
    return await trans_repo.get_by_conversation(conversation_id)
