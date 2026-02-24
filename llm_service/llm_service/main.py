"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import livekit_router
from .api.routes.battlecards import router as battlecards_router
from .api.routes.models import router as models_router
from .settings import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered real-time conversation assistant",
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
app.include_router(battlecards_router)
app.include_router(models_router)


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
