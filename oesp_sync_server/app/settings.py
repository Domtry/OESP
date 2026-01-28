from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "OESP-SYNC Server"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/oesp_sync"
    API_KEY_REQUIRED: bool = False
    GLOBAL_API_KEY: Optional[str] = None
    MAX_CHUNK_BYTES: int = 500_000
    
    # OESP SDK Configuration
    MAX_CLOCK_SKEW_SEC: int = 300
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
