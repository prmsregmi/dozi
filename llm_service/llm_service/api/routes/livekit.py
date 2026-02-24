"""LiveKit room and token management endpoints."""

import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...auth import AuthenticatedUser, get_current_user
from ...services.livekit_service import LiveKitService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["livekit"])

# Initialize service
livekit_service = LiveKitService()


class CreateRoomRequest(BaseModel):
    """Request to create a LiveKit room."""

    room_name: str | None = None
    metadata: dict | None = None
    dispatch_agent: bool = True


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
async def create_room(
    request: CreateRoomRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> CreateRoomResponse:
    """Create a new LiveKit room."""
    try:
        room_name = request.room_name or f"session_{uuid4().hex[:12]}"
        metadata_str = json.dumps(request.metadata) if request.metadata else None
        room_name = await livekit_service.create_room(room_name, metadata=metadata_str)
        if request.dispatch_agent:
            await livekit_service.dispatch_agent(room_name)
        return CreateRoomResponse(room_name=room_name, url=livekit_service.url)
    except Exception as e:
        logger.error(f"Failed to create room: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create room: {e}") from e


@router.post("/token", response_model=GenerateTokenResponse)
async def generate_token(
    request: GenerateTokenRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> GenerateTokenResponse:
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
