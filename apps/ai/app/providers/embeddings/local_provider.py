import asyncio
from typing import List
from app.providers.embeddings.base import EmbeddingProvider
from app.core.config import settings

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.LOCAL_EMBEDDING_MODEL)
    return _model


class LocalEmbeddingProvider(EmbeddingProvider):
    """Embeddings locales (gratis) con sentence-transformers.

    El modelo por defecto BAAI/bge-m3 produce vectores de 1024 dimensiones,
    compatibles con la columna vector(1024) de la base.
    """

    def __init__(self):
        self.model_name = settings.LOCAL_EMBEDDING_MODEL

    async def embed_text(self, text: str) -> List[float]:
        return (await self.embed_texts([text]))[0]

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        def _encode():
            model = _get_model()
            vectors = model.encode(
                texts,
                normalize_embeddings=True,
                convert_to_numpy=True,
            )
            return [v.tolist() for v in vectors]

        return await asyncio.to_thread(_encode)

    def get_dimension(self) -> int:
        try:
            model = _get_model()
            dim = model.get_sentence_embedding_dimension()
            if dim and dim != settings.EMBEDDING_DIMENSION:
                raise ValueError(f"Embedding dimension mismatch: model={dim}, configured={settings.EMBEDDING_DIMENSION}")
            return dim or settings.EMBEDDING_DIMENSION
        except Exception as e:
            if isinstance(e, ValueError) and "mismatch" in str(e):
                raise
            return settings.EMBEDDING_DIMENSION
