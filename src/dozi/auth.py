"""Authentication utilities and middleware."""

from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from supabase import AsyncClient

from .db import create_user_client
from .settings import settings

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

_jwks_client = PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")


@dataclass
class AuthenticatedUser:
    id: str
    token: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> AuthenticatedUser:
    """Validate Supabase JWT token and return authenticated user context."""
    token = credentials.credentials

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
            )

        return AuthenticatedUser(id=user_id, token=token)

    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        ) from exc


async def get_supabase(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AsyncClient:
    """FastAPI dependency: per-request Supabase client that respects RLS."""
    return await create_user_client(user.token)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_optional),
) -> str | None:
    """Optional authentication — returns user_id if token present, None otherwise."""
    if not credentials:
        return None

    try:
        user = await get_current_user(credentials)
        return user.id
    except HTTPException:
        return None
