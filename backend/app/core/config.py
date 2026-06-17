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
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 14

    # CORS — comma-separated string to avoid JSON-parsing pitfalls from env
    cors_origins: str = "http://localhost:5173"

    # Content directory (source for the seeder)
    content_dir: str = "../content"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
