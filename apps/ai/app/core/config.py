from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
    REDIS_URL: str = "redis://:CAMBIAR_POR_SEGURO@localhost:6379"
    
    OPENAI_API_KEY: str = ""
    # Base URL compatible con OpenAI. Vacío = OpenAI oficial.
    # Groq:  https://api.groq.com/openai/v1
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = "llama-3.3-70b-versatile"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # Proveedor de embeddings: "local" (sentence-transformers, gratis) u "openai".
    EMBEDDING_PROVIDER: str = "local"
    LOCAL_EMBEDDING_MODEL: str = "BAAI/bge-m3"

    COHERE_API_KEY: str = ""
    COHERE_RERANK_MODEL: str = "rerank-v3.5"
    
    AI_SERVICE_SECRET: str = "CAMBIAR_POR_SEGURO"
    
    EMBEDDING_DIMENSION: int = 1024
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 200

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = ""
    
    class Config:
        env_file = ".env"

    def get_allowed_origins(self) -> List[str]:
        origins = []
        if self.ALLOWED_ORIGINS:
            origins.extend([o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()])
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        # Always allow localhost for dev
        for default in ["http://localhost:5173", "http://127.0.0.1:5173"]:
            if default not in origins:
                origins.append(default)
        return origins

    def validate_critical(self):
        issues = []
        if not self.DATABASE_URL or 'CAMBIAR_POR_SEGURO' in self.DATABASE_URL:
            issues.append('DATABASE_URL not configured')
        if self.EMBEDDING_PROVIDER == 'openai' and not self.OPENAI_API_KEY:
            issues.append('OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai')
        if issues:
            raise ValueError('; '.join(issues))


settings = Settings()