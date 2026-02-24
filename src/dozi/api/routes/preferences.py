"""User preferences endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from supabase import AsyncClient

from ...auth import AuthenticatedUser, get_current_user, get_supabase
from ...models.db_models import UserPreferencesResponse, UserPreferencesUpdate
from ...models.schemas import AssistMode
from ...prompts.loader import prompt_loader
from ...settings import settings

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/", response_model=UserPreferencesResponse)
async def get_preferences(
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Get user preferences. Creates default if doesn't exist."""
    result = await supabase.table("user_preferences").select("*").maybe_single().execute()

    if result is None or not result.data:
        result = await (
            supabase.table("user_preferences")
            .insert({"user_id": user.id, "default_mode": "meeting", "settings": {}})
            .execute()
        )
        return UserPreferencesResponse(**result.data[0])

    return UserPreferencesResponse(**result.data)


@router.patch("/", response_model=UserPreferencesResponse)
async def update_preferences(
    data: UserPreferencesUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Update user preferences."""
    update_data = {}

    if data.default_mode is not None:
        update_data["default_mode"] = data.default_mode

    if data.settings is not None:
        update_data["settings"] = data.settings

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    result = await (
        supabase.table("user_preferences").update(update_data).eq("user_id", user.id).execute()
    )

    return UserPreferencesResponse(**result.data[0])


@router.get("/config")
async def get_config():
    """Return app-level configuration flags."""
    return {"granular_settings": settings.granular_settings}


@router.get("/prompt-defaults")
async def get_prompt_defaults():
    """Return the default YAML prompt content for all modes."""
    defaults = {}
    for mode in AssistMode:
        prompt = prompt_loader.get_prompt(mode)
        defaults[mode.value] = {
            "system_message": prompt.system_message,
            "user_message": prompt.template.user_message,
        }
    return defaults
