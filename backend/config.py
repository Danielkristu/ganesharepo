from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    supabase_jwt_secret: str
    resend_api_key: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None
    livekit_ws_url: Optional[str] = None  # e.g. wss://yourproject.livekit.cloud
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {
        "env_file": ".env.local",
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # silently ignore unknown env vars (e.g. old DAILY_API_KEY)
    }


settings = Settings()
