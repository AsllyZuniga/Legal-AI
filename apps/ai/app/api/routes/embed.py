from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.config import settings

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
        from app.providers.factory import get_embedding_provider
        provider = get_embedding_provider()
        embeddings = await provider.embed_texts(request.texts)
        return EmbedResponse(
            embeddings=embeddings,
            dimension=provider.get_dimension(),
            provider=settings.EMBEDDING_PROVIDER,
        )
    except ImportError:
        raise HTTPException(status_code=503, detail="Proveedor de embeddings no instalado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/single")
async def embed_single(text: str):
    try:
        from app.providers.factory import get_embedding_provider
        provider = get_embedding_provider()
        embedding = await provider.embed_text(text)
        return {"embedding": embedding, "dimension": len(embedding), "provider": settings.EMBEDDING_PROVIDER}
    except ImportError:
        raise HTTPException(status_code=503, detail="Proveedor de embeddings no instalado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
