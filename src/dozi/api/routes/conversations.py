"""Conversation management endpoints."""

import json
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from supabase import AsyncClient

from ...auth import AuthenticatedUser, get_current_user, get_supabase
from ...models.db_models import ConversationCreate, ConversationResponse
from ...models.schemas import UserSettings
from ...repositories import ConversationRepository
from ...services.livekit_service import LiveKitService

router = APIRouter(prefix="/conversations", tags=["conversations"])
livekit_service = LiveKitService()


@router.post("/", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Create a new conversation and LiveKit room."""
    # Load user STT settings for room metadata
    room_metadata: dict = {}
    prefs_result = (
        await supabase.table("user_preferences").select("settings").maybe_single().execute()
    )
    if prefs_result and prefs_result.data and prefs_result.data.get("settings"):
        user_settings = UserSettings(**prefs_result.data["settings"])
        room_metadata = {
            "stt_model": user_settings.stt_model,
            "min_silence_duration": user_settings.min_silence_duration,
            "min_speech_duration": user_settings.min_speech_duration,
        }

    room_name = f"session_{data.mode.value}_{uuid4().hex[:12]}"
    await livekit_service.create_room(
        room_name, metadata=json.dumps(room_metadata) if room_metadata else None
    )
    await livekit_service.dispatch_agent(room_name)

    repo = ConversationRepository(supabase)
    return await repo.create(user_id=user.id, data=data, room_name=room_name)


@router.get("/", response_model=list[ConversationResponse])
async def get_conversations(
    limit: int = 50,
    offset: int = 0,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Get all conversations for the authenticated user."""
    repo = ConversationRepository(supabase)
    return await repo.get_user_conversations(limit, offset)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Get a specific conversation by ID."""
    repo = ConversationRepository(supabase)
    conversation = await repo.get_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return conversation


@router.patch("/{conversation_id}/complete")
async def complete_conversation(
    conversation_id: UUID,
    duration_seconds: int,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Mark conversation as completed and set duration."""
    repo = ConversationRepository(supabase)

    conversation = await repo.get_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    await repo.update_status(conversation_id, "completed")
    return await repo.update_duration(conversation_id, duration_seconds)
