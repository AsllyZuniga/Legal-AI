from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
    REDIS_URL: str = "redis://:CAMBIAR_POR_SEGURO@localhost:6379"
    
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    
    COHERE_API_KEY: str = ""
    COHERE_RERANK_MODEL: str = "rerank-v3.5"
    
    AI_SERVICE_SECRET: str = "CAMBIAR_POR_SEGURO"
    
    EMBEDDING_DIMENSION: int = 1024
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 200
    
    class Config:
        env_file = ".env"

settings = Settings()