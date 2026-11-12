from app.core.config import settings


def get_llm_provider():
    from app.providers.llm.openai_provider import OpenAILLMProvider
    return OpenAILLMProvider()


def get_embedding_provider():
    if settings.EMBEDDING_PROVIDER.lower() == "local":
        from app.providers.embeddings.local_provider import LocalEmbeddingProvider
        return LocalEmbeddingProvider()
    from app.providers.embeddings.openai_provider import OpenAIEmbeddingProvider
    return OpenAIEmbeddingProvider()


def get_reranker():
    if not settings.COHERE_API_KEY:
        return None
    from app.providers.reranking.cohere_provider import CohereRerankingProvider
    return CohereRerankingProvider()
