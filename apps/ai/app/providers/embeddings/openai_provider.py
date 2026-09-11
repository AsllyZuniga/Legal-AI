from openai import AsyncOpenAI
from app.providers.embeddings.base import EmbeddingProvider
from app.core.config import settings
from typing import List

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_EMBEDDING_MODEL
    
    async def embed_text(self, text: str) -> List[float]:
        response = await self.client.embeddings.create(input=text, model=self.model)
        return response.data[0].embedding
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(input=texts, model=self.model)
        return [item.embedding for item in response.data]
    
    def get_dimension(self) -> int:
        return settings.EMBEDDING_DIMENSION