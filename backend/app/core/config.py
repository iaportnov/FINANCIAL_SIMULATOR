from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/financial_simulator"
    )

    # Auth / JWT
    jwt_secret: str = "dev-secret-change-me-32-bytes-minimum"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 14

    # CORS — comma-separated string to avoid JSON-parsing pitfalls from env
    cors_origins: str = "http://localhost:5173"

    # Content directory (source for the seeder)
    content_dir: str = "../content"

    # AI tutor (OpenAI-compatible). Empty key disables the assistant endpoint.
    openai_api_key: str = ""
    tutor_model: str = "openai/gpt-4o-mini"
    tutor_max_tokens: int = 1024

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def tutor_enabled(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
