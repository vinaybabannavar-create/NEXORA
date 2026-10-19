from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

from app.api.routes.documents import (
    router as documents_router,
)

from app.api.routes.indexing import (
    router as indexing_router,
)

from app.api.routes.search import (
    router as search_router,
)

from app.api.routes.rag import (
    router as rag_router,
)


class Settings(BaseSettings):
    app_name: str = "NEXORA AI Service"
    version: str = "0.5.0"


settings = Settings()


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "NEXORA AI Document Intelligence, "
        "Semantic Search and RAG service."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "service": "nexora-fastapi",
        "status": "ok",
    }


@app.get("/api/v1/ai/status")
def ai_status():
    return {
        "service": "ai",
        "status": "ready",
        "message": (
            "AI/RAG service supports "
            "document extraction, indexing, "
            "semantic search and context retrieval."
        ),
    }


app.include_router(
    documents_router,
    prefix="/api/v1/ai",
)

app.include_router(
    indexing_router,
    prefix="/api/v1/ai",
)

app.include_router(
    search_router,
    prefix="/api/v1/ai",
)

app.include_router(
    rag_router,
    prefix="/api/v1/ai",
)