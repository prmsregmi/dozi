"""Pydantic schemas for request/response models."""

from enum import StrEnum

from pydantic import BaseModel, Field

from .settings import LLM_DEFAULT


class AssistMode(StrEnum):
    """Mode of conversation assistance."""

    MEETING = "meeting"
    CALL = "call"
    INTERVIEW = "interview"


class Insight(BaseModel):
    """Individual insight or suggestion."""

    type: str = Field(..., description="Type of insight (key_point, objection, suggestion, etc.)")
    content: str = Field(..., description="The insight content")
    priority: str = Field(default="medium", description="Priority level: low, medium, high")


class BattleCard(BaseModel):
    """Battle card with conversation insights and suggestions."""

    mode: AssistMode = Field(..., description="Mode of assistance")
    insights: list[Insight] = Field(default_factory=list, description="List of insights")
    summary: str = Field(..., description="Overall summary of the conversation so far")
    recommendations: list[str] = Field(default_factory=list, description="Action recommendations")


class PromptOverride(BaseModel):
    """Per-mode prompt override. None values mean use the default YAML prompt."""

    system_message: str | None = None
    user_message: str | None = None


class UserSettings(BaseModel):
    """LLM-relevant settings passed by the frontend when generating battle cards."""

    llm_model: str = LLM_DEFAULT
    temperature: float = Field(default=0.3, ge=0.0, le=1.0)
    prompt_overrides: dict[str, PromptOverride] | None = None
