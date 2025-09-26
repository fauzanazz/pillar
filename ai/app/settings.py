from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        protected_namespaces=('settings_',),
        extra='ignore'
    )
    openai_api_key: str = Field("", description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o-mini", description="OpenAI model name")
    
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated CORS origins"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    log_level: str = Field(default="INFO", description="Logging level")
    rate_limit_requests: int = Field(default=100, description="Max requests per minute per IP")
    
    # Supabase configuration
    supabase_url: str = Field(default="", description="Supabase project URL")
    supabase_key: str = Field(default="", description="Supabase anon/service key")
    # Optional: Direct PostgreSQL connection (for SQLAlchemy)
    database_url: str = Field(default="", description="PostgreSQL connection URL")

settings = Settings()