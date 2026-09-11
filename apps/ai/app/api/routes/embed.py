from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class EmbedRequest(BaseModel):
    texts: List[str]

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    provider: str

@router.post("/", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest):
    try:
        from app.providers.embeddings.openai_provider import OpenAIEmbeddingProvider
        provider = OpenAIEmbeddingProvider()
        embeddings = await provider.embed_texts(request.texts)
        return EmbedResponse(
            embeddings=embeddings,
            dimension=provider.get_dimension(),
            provider="openai",
        )
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed. Install with: pip install openai")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/single")
async def embed_single(text: str):
    try:
        from app.providers.embeddings.openai_provider import OpenAIEmbeddingProvider
        provider = OpenAIEmbeddingProvider()
        embedding = await provider.embed_text(text)
        return {"embedding": embedding, "dimension": len(embedding), "provider": "openai"}
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
