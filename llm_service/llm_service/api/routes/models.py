"""Model registry and prompt defaults endpoints."""

from fastapi import APIRouter

from ...prompts.loader import prompt_loader
from ...schemas import AssistMode
from ...settings import _LLM_REGISTRY, _STT_REGISTRY

router = APIRouter(tags=["models"])


@router.get("/models")
async def get_models():
    """Return all available STT and LLM models with their canonical defaults."""
    return {
        "stt": _STT_REGISTRY.get("models", []),
        "llm": _LLM_REGISTRY.get("models", []),
        "defaults": {
            "stt_model": _STT_REGISTRY["default"],
            "llm_model": _LLM_REGISTRY["default"],
        },
    }


@router.get("/prompts/defaults")
async def get_prompt_defaults():
    """Return the default YAML prompt content for all modes."""
    defaults = {}
    for mode in AssistMode:
        prompt = prompt_loader.get_prompt(mode)
        defaults[mode.value] = {
            "system_message": prompt.system_message,
            "user_message": prompt.template.user_message,
        }
    return defaults
