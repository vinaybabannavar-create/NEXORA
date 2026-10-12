from __future__ import annotations

from typing import Any

from app.services.semantic_search_service import (
    SemanticSearchService,
)


class RAGService:
    """
    Retrieval-Augmented Generation foundation.

    Currently responsible for:
    1. Retrieving relevant document chunks.
    2. Building a clean context block.
    3. Preparing source metadata.

    LLM generation will be added in the next stage.
    """

    def __init__(
        self,
        semantic_search: SemanticSearchService | None = None,
    ) -> None:
        self.semantic_search = (
            semantic_search or SemanticSearchService()
        )

    def retrieve_context(
        self,
        query: str,
        limit: int = 5,
        document_id: str | None = None,
    ) -> dict[str, Any]:

        search_result = self.semantic_search.search(
            query=query,
            limit=limit,
            document_id=document_id,
        )

        results = search_result["results"]

        context_parts: list[str] = []
        sources: list[dict[str, Any]] = []

        for index, result in enumerate(results, start=1):
            text = result.get("text") or ""

            if text:
                context_parts.append(
                    f"[Context {index}]\n{text}"
                )

            sources.append(
                {
                    "source_number": index,
                    "document_id": result.get("document_id"),
                    "filename": result.get("filename"),
                    "chunk_index": result.get("chunk_index"),
                    "score": result.get("score"),
                }
            )

        context = "\n\n".join(context_parts)

        return {
            "success": True,
            "query": query,
            "context": context,
            "context_count": len(context_parts),
            "sources": sources,
        }


rag_service = RAGService()