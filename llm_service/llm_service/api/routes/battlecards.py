"""Battle card endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...auth import AuthenticatedUser, get_current_user
from ...schemas import AssistMode, BattleCard, UserSettings
from ...services.battlecard_service import BattleCardService

router = APIRouter(prefix="/battlecards", tags=["battlecards"])
battlecard_service = BattleCardService()


class GenerateBattleCardRequest(BaseModel):
    """Request to generate a battle card."""

    transcript: str
    mode: AssistMode
    user_settings: UserSettings | None = None


@router.post("/generate", response_model=BattleCard)
async def generate_battlecard(
    data: GenerateBattleCardRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> BattleCard:
    """Generate a battle card from transcript."""
    try:
        return await battlecard_service.generate_battlecard(
            data.transcript, data.mode, user_settings=data.user_settings
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM generation failed: {exc}") from exc
