from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_service import rag_service


router = APIRouter(
    prefix="/rag",
    tags=["AI RAG"],
)


class RAGContextRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        description="Question to retrieve context for.",
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of relevant chunks to retrieve.",
    )

    document_id: str | None = Field(
        default=None,
        description="Optional document ID filter.",
    )


@router.post("/context")
def build_rag_context(
    request: RAGContextRequest,
):
    try:
        return rag_service.retrieve_context(
            query=request.query,
            limit=request.limit,
            document_id=request.document_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"RAG context generation failed: {exc}",
        ) from exc