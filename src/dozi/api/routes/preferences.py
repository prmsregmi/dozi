"""User preferences endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from supabase import AsyncClient

from ...auth import get_supabase
from ...models.db_models import UserPreferencesResponse, UserPreferencesUpdate

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/", response_model=UserPreferencesResponse)
async def get_preferences(supabase: AsyncClient = Depends(get_supabase)):
    """Get user preferences. Creates default if doesn't exist."""
    result = await supabase.table("user_preferences").select("*").maybe_single().execute()

    if result is None or not result.data:
        result = await (
            supabase.table("user_preferences")
            .insert({"default_mode": "meeting", "settings": {}})
            .execute()
        )
        return UserPreferencesResponse(**result.data[0])

    return UserPreferencesResponse(**result.data)


@router.patch("/", response_model=UserPreferencesResponse)
async def update_preferences(
    data: UserPreferencesUpdate,
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

    result = await supabase.table("user_preferences").update(update_data).execute()

    return UserPreferencesResponse(**result.data[0])
