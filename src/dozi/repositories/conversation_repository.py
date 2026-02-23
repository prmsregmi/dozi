"""Repository for conversation CRUD operations."""

from uuid import UUID

from supabase import AsyncClient

from ..models.db_models import ConversationCreate, ConversationResponse


class ConversationRepository:
    """Handles conversation database operations."""

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def create(
        self, user_id: str, data: ConversationCreate, room_name: str | None = None
    ) -> ConversationResponse:
        """Create a new conversation."""
        result = await (
            self.supabase.table("conversations")
            .insert(
                {
                    "user_id": user_id,
                    "title": data.title,
                    "mode": data.mode.value,
                    "livekit_room_name": room_name,
                }
            )
            .execute()
        )

        return ConversationResponse(**result.data[0])

    async def get_by_id(self, conversation_id: UUID) -> ConversationResponse | None:
        """Get conversation by ID. Returns None if not found or RLS filters it out."""
        result = await (
            self.supabase.table("conversations")
            .select("*")
            .eq("id", str(conversation_id))
            .maybe_single()
            .execute()
        )

        if result is None or not result.data:
            return None

        return ConversationResponse(**result.data)

    async def get_user_conversations(
        self, limit: int = 50, offset: int = 0
    ) -> list[ConversationResponse]:
        """Get all conversations for the authenticated user (scoped by RLS)."""
        result = await (
            self.supabase.table("conversations")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )

        return [ConversationResponse(**item) for item in result.data]

    async def update_status(self, conversation_id: UUID, status: str) -> ConversationResponse:
        """Update conversation status."""
        result = await (
            self.supabase.table("conversations")
            .update({"status": status})
            .eq("id", str(conversation_id))
            .execute()
        )

        return ConversationResponse(**result.data[0])

    async def update_duration(
        self, conversation_id: UUID, duration_seconds: int
    ) -> ConversationResponse:
        """Update conversation duration."""
        result = await (
            self.supabase.table("conversations")
            .update({"duration_seconds": duration_seconds})
            .eq("id", str(conversation_id))
            .execute()
        )

        return ConversationResponse(**result.data[0])
