"""Battle card endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from supabase import AsyncClient

from ...auth import get_supabase
from ...models.db_models import BattleCardCreate, BattleCardResponse
from ...models.schemas import AssistMode, UserSettings
from ...repositories import BattleCardRepository, ConversationRepository, TranscriptionRepository
from ...services.battlecard_service import BattleCardService

router = APIRouter(prefix="/battlecards", tags=["battlecards"])
battlecard_service = BattleCardService()


class GenerateBattleCardRequest(BaseModel):
    """Request to generate a battle card."""

    conversation_id: UUID
    transcript: str | None = None


@router.post("/generate", response_model=BattleCardResponse)
async def generate_battlecard(
    data: GenerateBattleCardRequest,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Generate a battle card from transcript."""
    conv_repo = ConversationRepository(supabase)
    conversation = await conv_repo.get_by_id(data.conversation_id)

    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if data.transcript:
        transcript = data.transcript
    else:
        trans_repo = TranscriptionRepository(supabase)
        transcript = await trans_repo.get_full_transcript(data.conversation_id)

        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript available"
            )

    # Load user settings for model/temperature/prompt overrides
    user_settings: UserSettings | None = None
    prefs_result = (
        await supabase.table("user_preferences").select("settings").maybe_single().execute()
    )
    if prefs_result and prefs_result.data and prefs_result.data.get("settings"):
        user_settings = UserSettings(**prefs_result.data["settings"])

    mode = AssistMode(conversation.mode)
    battlecard = await battlecard_service.generate_battlecard(
        transcript, mode, user_settings=user_settings
    )

    bc_repo = BattleCardRepository(supabase)
    return await bc_repo.create(
        BattleCardCreate(
            conversation_id=data.conversation_id,
            insights=battlecard.insights,
            summary=battlecard.summary,
            recommendations=battlecard.recommendations,
        )
    )


@router.get("/conversation/{conversation_id}", response_model=list[BattleCardResponse])
async def get_battlecards_for_conversation(
    conversation_id: UUID,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Get all battle cards for a conversation."""
    bc_repo = BattleCardRepository(supabase)
    return await bc_repo.get_by_conversation(conversation_id)
