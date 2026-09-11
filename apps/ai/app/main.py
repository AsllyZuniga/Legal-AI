from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import embed, search, analyze, generate, verify, chat

app = FastAPI(
    title="Legal AI Service",
    description="Motor de IA para Asistente Jurídico Inteligente",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embed.router, prefix="/internal/embed", tags=["Embeddings"])
app.include_router(search.router, prefix="/internal/search", tags=["Search"])
app.include_router(analyze.router, prefix="/internal/analyze", tags=["Analysis"])
app.include_router(generate.router, prefix="/internal/generate", tags=["Generation"])
app.include_router(verify.router, prefix="/internal/verify", tags=["Verification"])
app.include_router(chat.router, prefix="/internal/chat", tags=["Chat"])

@app.get("/internal/health")
async def health_check():
    return {"status": "healthy", "service": "legal-ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)