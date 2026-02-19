"""Repository for transcription CRUD operations."""

from uuid import UUID

from supabase import AsyncClient

from ..models.db_models import TranscriptionCreate, TranscriptionResponse


class TranscriptionRepository:
    """Handles transcription database operations."""

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def create(self, data: TranscriptionCreate) -> TranscriptionResponse:
        """Save a transcription."""
        result = await (
            self.supabase.table("transcriptions")
            .insert(
                {
                    "conversation_id": str(data.conversation_id),
                    "text": data.text,
                    "speaker": data.speaker,
                    "sequence_number": data.sequence_number,
                }
            )
            .execute()
        )

        return TranscriptionResponse(**result.data[0])

    async def get_by_conversation(self, conversation_id: UUID) -> list[TranscriptionResponse]:
        """Get all transcriptions for a conversation."""
        result = await (
            self.supabase.table("transcriptions")
            .select("*")
            .eq("conversation_id", str(conversation_id))
            .order("timestamp", desc=False)
            .execute()
        )

        return [TranscriptionResponse(**item) for item in result.data]

    async def get_full_transcript(self, conversation_id: UUID) -> str:
        """Get concatenated transcript text for a conversation."""
        transcriptions = await self.get_by_conversation(conversation_id)
        return "\n".join([t.text for t in transcriptions])
