"""Application settings and configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # API Keys
    openai_api_key: str
    livekit_api_key: str
    livekit_api_secret: str
    livekit_url: str = "wss://your-livekit-instance.livekit.cloud"

    # LLM Configuration
    llm_model: str = "gpt-5.2"

    # Whisper Configuration
    whisper_model: str = "whisper-1"

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
