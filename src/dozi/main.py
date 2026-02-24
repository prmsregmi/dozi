"""Main FastAPI application."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import livekit_router
from .api.routes.battlecards import router as battlecards_router
from .api.routes.conversations import router as conversations_router
from .api.routes.preferences import router as preferences_router
from .api.routes.transcriptions import router as transcriptions_router
from .db import close_clients, init_clients
from .settings import settings


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Manage Supabase client lifecycle."""
    await init_clients()
    yield
    await close_clients()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered real-time conversation assistant",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,  # type: ignore[invalid-argument-type]
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(livekit_router)
app.include_router(conversations_router)
app.include_router(battlecards_router)
app.include_router(transcriptions_router)
app.include_router(preferences_router)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "AI-powered conversation assistant",
    }


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}
