"""Application settings and configuration."""

from pathlib import Path

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict

# --- Model registry (single source of truth from YAML) ---

_PROJECT_ROOT = Path(__file__).parent.parent


def _load_yaml(filename: str) -> dict:
    with (_PROJECT_ROOT / filename).open() as f:
        return yaml.safe_load(f)


_MODELS = _load_yaml("models.yaml")
_STT_REGISTRY = _MODELS["stt"]
_LLM_REGISTRY = _MODELS["llm"]

_LLM_PROVIDERS: dict[str, str] = {}
for _entry in _LLM_REGISTRY.get("models", []):
    _LLM_PROVIDERS[_entry["model"]] = _entry["provider"]

LLM_DEFAULT = _LLM_REGISTRY["default"]


def provider_for_model(model: str) -> str:
    """Derive the LLM provider from a model name."""
    provider = _LLM_PROVIDERS.get(model)
    if provider is None:
        raise ValueError(f"Unknown model '{model}'. Supported models: {', '.join(_LLM_PROVIDERS)}")
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
    groq_api_key: str = ""

    # LLM Configuration (default from llm_models.yaml)
    llm_model: str = LLM_DEFAULT

    # Auth — only used to construct the JWKS endpoint for JWT validation
    auth_jwks_url: str

    # CORS
    cors_origins: list[str] = ["*"]

    # Application Settings
    app_name: str = "Dozi"
    app_version: str = "0.1.0"
    debug: bool = False


settings = Settings()  # type: ignore[call-arg]
