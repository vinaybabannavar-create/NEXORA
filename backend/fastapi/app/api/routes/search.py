from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.semantic_search_service import (
    semantic_search_service,
)


router = APIRouter(
    prefix="/search",
    tags=["AI Semantic Search"],
)


class SemanticSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        description="Natural-language question or search query.",
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of results.",
    )

    document_id: Optional[str] = Field(
        default=None,
        description="Optional document ID filter.",
    )


@router.post("")
def semantic_search(
    request: SemanticSearchRequest,
):
    try:
        return semantic_search_service.search(
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
            detail=f"Semantic search failed: {exc}",
        ) from exc