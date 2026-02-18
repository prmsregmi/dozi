"""Supabase database client with async support and shared httpx pool."""

from httpx import AsyncClient as HttpxAsyncClient
from supabase.lib.client_options import AsyncClientOptions

from supabase import AsyncClient, acreate_client

from .settings import settings

_httpx_client: HttpxAsyncClient | None = None
_service_client: AsyncClient | None = None


async def init_clients() -> None:
    """Initialize shared httpx pool and service-role client. Call from FastAPI lifespan."""
    global _httpx_client, _service_client  # noqa: PLW0603
    _httpx_client = HttpxAsyncClient()
    _service_client = await acreate_client(
        settings.supabase_url,
        settings.supabase_service_key,
        options=AsyncClientOptions(httpx_client=_httpx_client),
    )


async def close_clients() -> None:
    """Tear down clients. Call from FastAPI lifespan."""
    global _httpx_client, _service_client  # noqa: PLW0603
    if _httpx_client:
        await _httpx_client.aclose()
        _httpx_client = None
    _service_client = None


def get_service_client() -> AsyncClient:
    """Return the service-role async client (bypasses RLS)."""
    if _service_client is None:
        raise RuntimeError("Supabase clients not initialized — call init_clients() first")
    return _service_client


async def create_user_client(access_token: str) -> AsyncClient:
    """Create a per-request async client that respects RLS via the user's JWT."""
    return await acreate_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=AsyncClientOptions(
            headers={"Authorization": f"Bearer {access_token}"},
            httpx_client=_httpx_client,
        ),
    )
