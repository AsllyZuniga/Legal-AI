from openai import AsyncOpenAI
from app.providers.embeddings.base import EmbeddingProvider
from app.core.config import settings
from typing import List

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL or None)
        self.model = settings.OPENAI_EMBEDDING_MODEL
    
    async def embed_text(self, text: str) -> List[float]:
        response = await self.client.embeddings.create(input=text, model=self.model)
        return response.data[0].embedding
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(input=texts, model=self.model)
        return [item.embedding for item in response.data]
    
    def get_dimension(self) -> int:
        if "large" in self.model:
            dim = 3072
        elif "small" in self.model:
            dim = 1536
        else:
            dim = settings.EMBEDDING_DIMENSION
        if settings.EMBEDDING_DIMENSION and dim != settings.EMBEDDING_DIMENSION:
            raise ValueError(f"Embedding dimension mismatch: model={dim}, configured={settings.EMBEDDING_DIMENSION}")
        return dim