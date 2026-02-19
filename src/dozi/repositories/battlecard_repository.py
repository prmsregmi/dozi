"""Repository for battle card CRUD operations."""

from uuid import UUID

from supabase import AsyncClient

from ..models.db_models import BattleCardCreate, BattleCardResponse


class BattleCardRepository:
    """Handles battle card database operations."""

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def create(self, data: BattleCardCreate) -> BattleCardResponse:
        """Save a battle card."""
        result = await (
            self.supabase.table("battle_cards")
            .insert(
                {
                    "conversation_id": str(data.conversation_id),
                    "insights": [insight.model_dump() for insight in data.insights],
                    "summary": data.summary,
                    "recommendations": data.recommendations,
                }
            )
            .execute()
        )

        return BattleCardResponse(**result.data[0])

    async def get_by_conversation(self, conversation_id: UUID) -> list[BattleCardResponse]:
        """Get all battle cards for a conversation."""
        result = await (
            self.supabase.table("battle_cards")
            .select("*")
            .eq("conversation_id", str(conversation_id))
            .order("created_at", desc=True)
            .execute()
        )

        return [BattleCardResponse(**item) for item in result.data]

    async def get_latest_by_conversation(self, conversation_id: UUID) -> BattleCardResponse | None:
        """Get the most recent battle card for a conversation."""
        result = await (
            self.supabase.table("battle_cards")
            .select("*")
            .eq("conversation_id", str(conversation_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        return BattleCardResponse(**result.data[0])
