from __future__ import annotations

from typing import Any

from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore


class SemanticSearchService:
    """
    Performs semantic similarity search against
    document chunks stored in Qdrant.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService | None = None,
        vector_store: VectorStore | None = None,
    ) -> None:
        self.embedding_service = (
            embedding_service or EmbeddingService()
        )

        self.vector_store = (
            vector_store or VectorStore()
        )

    def search(
        self,
        query: str,
        limit: int = 5,
        document_id: str | None = None,
    ) -> dict[str, Any]:
        query = query.strip()

        if not query:
            raise ValueError(
                "Search query cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "limit must be greater than zero."
            )

        # Convert the user's question into
        # the same 384-dimensional embedding space
        # used when indexing documents.
        query_embedding = (
            self.embedding_service.embed_text(query)
        )

        # Search Qdrant using cosine similarity.
        matches = self.vector_store.search(
            query_embedding=query_embedding,
            limit=limit,
            document_id=document_id,
        )

        results = []

        for match in matches:
            payload = match.get("payload") or {}

            results.append(
                {
                    "id": match.get("id"),
                    "score": match.get("score"),
                    "document_id": payload.get(
                        "document_id"
                    ),
                    "filename": payload.get(
                        "filename"
                    ),
                    "chunk_index": payload.get(
                        "chunk_index"
                    ),
                    "text": payload.get("text"),
                }
            )

        return {
            "success": True,
            "query": query,
            "result_count": len(results),
            "results": results,
        }


semantic_search_service = SemanticSearchService()