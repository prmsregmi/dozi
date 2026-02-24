"""Service for LiveKit audio streaming integration."""

from livekit import api

from ..settings import settings


class LiveKitService:
    """Handles LiveKit room and token management."""

    def __init__(self):
        """Initialize LiveKit service."""
        self.api_key = settings.livekit_api_key
        self.api_secret = settings.livekit_api_secret
        self.url = settings.livekit_url
        self._lkapi = None

    @property
    def lkapi(self) -> api.LiveKitAPI:
        """Lazily initialize and return LiveKitAPI client."""
        if self._lkapi is None:
            self._lkapi = api.LiveKitAPI(
                url=self.url,
                api_key=self.api_key,
                api_secret=self.api_secret,
            )
        return self._lkapi

    async def create_room(self, room_name: str, metadata: str | None = None) -> str:
        """
        Create a LiveKit room.

        Args:
            room_name: Name of the room to create
            metadata: Optional JSON metadata to attach to the room

        Returns:
            Room name
        """
        request = api.CreateRoomRequest(name=room_name)
        if metadata:
            request.metadata = metadata
        room = await self.lkapi.room.create_room(request)
        return room.name

    async def dispatch_agent(self, room_name: str, agent_name: str = "whisper-transcriber") -> None:
        """
        Explicitly dispatch an agent to a room.

        Args:
            room_name: Name of the room
            agent_name: Registered agent name to dispatch
        """
        await self.lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(agent_name=agent_name, room=room_name),
        )

    def generate_token(
        self, room_name: str, participant_identity: str, participant_name: str | None = None
    ) -> str:
        """
        Generate an access token for a participant.

        Args:
            room_name: Name of the room
            participant_identity: Unique identifier for the participant
            participant_name: Display name for the participant

        Returns:
            JWT token string
        """
        token = (
            api.AccessToken(self.api_key, self.api_secret)
            .with_identity(participant_identity)
            .with_name(participant_name or participant_identity)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
        )

        return token.to_jwt()

    async def list_rooms(self) -> list[str]:
        """
        List all active rooms.

        Returns:
            List of room names
        """
        response = await self.lkapi.room.list_rooms(api.ListRoomsRequest())
        return [room.name for room in response.rooms]

    async def delete_room(self, room_name: str) -> None:
        """
        Delete a room.

        Args:
            room_name: Name of the room to delete
        """
        await self.lkapi.room.delete_room(api.DeleteRoomRequest(room=room_name))
