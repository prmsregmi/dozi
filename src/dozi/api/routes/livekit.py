"""LiveKit room and token management endpoints."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...services.livekit_service import LiveKitService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["livekit"])

# Initialize service
livekit_service = LiveKitService()


class CreateRoomRequest(BaseModel):
    """Request to create a LiveKit room."""

    room_name: str


class CreateRoomResponse(BaseModel):
    """Response with room details."""

    room_name: str
    url: str


class GenerateTokenRequest(BaseModel):
    """Request to generate participant token."""

    room_name: str
    participant_identity: str
    participant_name: str | None = None


class GenerateTokenResponse(BaseModel):
    """Response with access token."""

    token: str
    url: str


@router.post("/rooms", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest) -> CreateRoomResponse:
    """
    Create a new LiveKit room.

    Args:
        request: CreateRoomRequest with room name

    Returns:
        Room details including URL
    """
    try:
        room_name = await livekit_service.create_room(request.room_name)
        return CreateRoomResponse(room_name=room_name, url=livekit_service.url)
    except Exception as e:
        logger.error(f"Failed to create room: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create room: {e}") from e


@router.get("/rooms", response_model=list[str])
async def list_rooms() -> list[str]:
    """
    List all active LiveKit rooms.

    Returns:
        List of room names
    """
    try:
        return await livekit_service.list_rooms()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list rooms: {e}") from e


@router.delete("/rooms/{room_name}")
async def delete_room(room_name: str) -> dict:
    """
    Delete a LiveKit room.

    Args:
        room_name: Name of the room to delete

    Returns:
        Success message
    """
    try:
        await livekit_service.delete_room(room_name)
        return {"message": f"Room {room_name} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete room: {e}") from e


@router.post("/token", response_model=GenerateTokenResponse)
async def generate_token(request: GenerateTokenRequest) -> GenerateTokenResponse:
    """
    Generate an access token for a participant.

    Args:
        request: Token generation request with room and participant details

    Returns:
        JWT token and LiveKit URL
    """
    try:
        token = livekit_service.generate_token(
            room_name=request.room_name,
            participant_identity=request.participant_identity,
            participant_name=request.participant_name,
        )
        return GenerateTokenResponse(token=token, url=livekit_service.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {e}") from e
