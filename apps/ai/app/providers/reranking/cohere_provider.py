import cohere
from app.providers.reranking.base import RerankingProvider
from app.core.config import settings
from typing import List, Tuple

class CohereRerankingProvider(RerankingProvider):
    def __init__(self):
        self.client = cohere.AsyncClientV2(api_key=settings.COHERE_API_KEY)
        self.model = settings.COHERE_RERANK_MODEL
    
    async def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = 10,
    ) -> List[Tuple[int, float]]:
        if not documents:
            return []
        
        response = await self.client.rerank(
            query=query,
            documents=documents,
            top_n=min(top_k, len(documents)),
            model=self.model,
        )
        
        return [(result.index, result.relevance_score) for result in response.results]