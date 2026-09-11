from abc import ABC, abstractmethod
from typing import List, Tuple

class RerankingProvider(ABC):
    @abstractmethod
    async def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = 10,
    ) -> List[Tuple[int, float]]:
        """Returns list of (index, relevance_score) tuples, sorted by score descending"""
        pass