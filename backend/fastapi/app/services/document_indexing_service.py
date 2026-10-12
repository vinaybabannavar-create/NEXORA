from __future__ import annotations

from typing import Any

from app.services.document_processor import DocumentProcessor
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore


class DocumentIndexingService:
    """
    Coordinates document extraction, chunking, embedding,
    and vector storage in Qdrant.
    """

    def __init__(
        self,
        processor: type[DocumentProcessor] = DocumentProcessor,
        embedding_service: EmbeddingService | None = None,
        vector_store: VectorStore | None = None,
    ) -> None:
        self.processor = processor
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or VectorStore()

    def index_document(
        self,
        document_id: str,
        filename: str,
        content: bytes,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not document_id:
            raise ValueError("document_id is required.")

        # 1. Extract text
        text = self.processor.extract_text(
            filename=filename,
            content=content,
        )

        # 2. Split text into chunks
        chunks = self.processor.chunk_text(text)

        if not chunks:
            raise ValueError("No chunks were generated from the document.")

        # 3. Generate embeddings
        embeddings = self.embedding_service.embed_texts(chunks)

        if len(chunks) != len(embeddings):
            raise ValueError(
                "Number of chunks does not match number of embeddings."
            )

        # 4. Remove previous vectors for this document
        self.vector_store.delete_document(document_id)

        # 5. Store vectors in Qdrant
        stored_count = self.vector_store.upsert_chunks(
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings,
            metadata={
                "filename": filename,
                **(metadata or {}),
            },
        )

        return {
            "success": True,
            "document_id": document_id,
            "filename": filename,
            "text_length": len(text),
            "chunk_count": len(chunks),
            "stored_vectors": stored_count,
            "embedding_dimension": self.embedding_service.dimension(),
            "collection": self.vector_store.COLLECTION_NAME,
        }


document_indexing_service = DocumentIndexingService()