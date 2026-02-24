"""Application settings and configuration."""

from pathlib import Path

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict

# --- Model registry (single source of truth from YAML) ---

_PROJECT_ROOT = Path(__file__).parent.parent.parent


def _load_yaml(filename: str) -> dict:
    with (_PROJECT_ROOT / filename).open() as f:
        return yaml.safe_load(f)


_STT_REGISTRY = _load_yaml("stt_models.yaml")
_LLM_REGISTRY = _load_yaml("llm_models.yaml")

_MODEL_PROVIDERS: dict[str, str] = {}
for _entry in _STT_REGISTRY.get("models", []):
    _MODEL_PROVIDERS[_entry["model"]] = _entry["provider"]
for _entry in _LLM_REGISTRY.get("models", []):
    _MODEL_PROVIDERS[_entry["model"]] = _entry["provider"]

STT_DEFAULT = _STT_REGISTRY["default"]
LLM_DEFAULT = _LLM_REGISTRY["default"]


def provider_for_model(model: str) -> str:
    """Derive the provider from a model name. Every supported model must be in
    the YAML files — if it's not, that's a configuration error."""
    provider = _MODEL_PROVIDERS.get(model)
    if provider is None:
        raise ValueError(
            f"Unknown model '{model}'. Supported models: {', '.join(_MODEL_PROVIDERS)}"
        )
    return provider


# --- App settings (from environment / .env) ---


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # API Keys
    openai_api_key: str
    livekit_api_key: str
    livekit_api_secret: str
    livekit_url: str = "wss://your-livekit-instance.livekit.cloud"
    deepgram_api_key: str = ""
    groq_api_key: str = ""

    # LLM Configuration (default from llm_models.yaml)
    llm_model: str = LLM_DEFAULT

    # Supabase Configuration
    supabase_url: str
    supabase_publishable_key: str
    supabase_service_key: str
    supabase_jwt_secret: str = ""

    # CORS
    cors_origins: list[str] = ["*"]

    # Application Settings
    app_name: str = "Dozi"
    app_version: str = "0.1.0"
    debug: bool = False
    granular_settings: bool = True


settings = Settings()  # type: ignore[call-arg]
