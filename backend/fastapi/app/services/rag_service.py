
from __future__ import annotations

from typing import Any

from app.services.llm_service import LLMService
from app.services.semantic_search_service import (
    SemanticSearchService,
)


class RAGService:
    """
    Retrieves relevant document chunks, builds context,
    and generates grounded answers using Gemini.
    """

    def __init__(
        self,
        semantic_search: SemanticSearchService | None = None,
        llm_service: LLMService | None = None,
    ) -> None:
        self.semantic_search = (
            semantic_search or SemanticSearchService()
        )
        self.llm_service = llm_service or LLMService()

    def retrieve_context(
        self,
        query: str,
        limit: int = 5,
        document_id: str | None = None,
    ) -> dict[str, Any]:
        query = query.strip()

        if not query:
            raise ValueError("Search query cannot be empty.")

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

        # Do not ask Gemini to answer without retrieved evidence.
        if not context.strip():
            return {
                "success": True,
                "query": query,
                "context": "",
                "context_count": 0,
                "sources": [],
                "answer": (
                    "I couldn't find relevant information "
                    "in the indexed documents."
                ),
            }

        # Generate an answer grounded in the retrieved context.
        answer = self.llm_service.generate_answer(
            query=query,
            context=context,
        )

        return {
            "success": True,
            "query": query,
            "context": context,
            "context_count": len(context_parts),
            "sources": sources,
            "answer": answer,
        }


rag_service = RAGService()
