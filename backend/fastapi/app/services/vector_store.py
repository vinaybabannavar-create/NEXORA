from __future__ import annotations

import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)


class VectorStore:
    """
    Qdrant vector-store abstraction for NEXORA.

    Handles creation, insertion, semantic search,
    and deletion of document vectors.
    """

    COLLECTION_NAME = "nexora_documents"
    VECTOR_SIZE = 384

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6333,
    ) -> None:
        self.client = QdrantClient(
            host=host,
            port=port,
        )

        self._ensure_collection()

    def _ensure_collection(self) -> None:
        collections = self.client.get_collections()

        collection_names = {
            collection.name
            for collection in collections.collections
        }

        if self.COLLECTION_NAME not in collection_names:
            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE,
                ),
            )

    @staticmethod
    def _point_id(
        document_id: str,
        chunk_index: int,
    ) -> str:
        """
        Generate a deterministic UUID for a document chunk.

        Qdrant accepts UUIDs or unsigned integers as point IDs.
        UUID5 guarantees the same document/chunk combination
        always produces the same point ID.
        """

        return str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"nexora-document:{document_id}:chunk:{chunk_index}",
            )
        )

    def upsert_chunks(
        self,
        document_id: str,
        chunks: list[str],
        embeddings: list[list[float]],
        metadata: dict[str, Any] | None = None,
    ) -> int:
        if len(chunks) != len(embeddings):
            raise ValueError(
                "Number of chunks must match number of embeddings."
            )

        if not document_id:
            raise ValueError(
                "document_id is required."
            )

        metadata = metadata or {}

        points: list[PointStruct] = []

        for index, (chunk, embedding) in enumerate(
            zip(chunks, embeddings)
        ):
            payload = {
                "document_id": document_id,
                "chunk_index": index,
                "text": chunk,
                **metadata,
            }

            points.append(
                PointStruct(
                    id=self._point_id(
                        document_id=document_id,
                        chunk_index=index,
                    ),
                    vector=embedding,
                    payload=payload,
                )
            )

        if points:
            self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=points,
            )

        return len(points)

    def search(
        self,
        query_embedding: list[float],
        limit: int = 5,
        document_id: str | None = None,
    ) -> list[dict[str, Any]]:
        if not query_embedding:
            raise ValueError(
                "query_embedding cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "limit must be greater than zero."
            )

        query_filter = None

        if document_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(
                            value=document_id
                        ),
                    )
                ]
            )

        results = self.client.query_points(
            collection_name=self.COLLECTION_NAME,
            query=query_embedding,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )

        matches: list[dict[str, Any]] = []

        for result in results.points:
            matches.append(
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload,
                }
            )

        return matches

    def delete_document(
        self,
        document_id: str,
    ) -> None:
        if not document_id:
            raise ValueError(
                "document_id is required."
            )

        self.client.delete(
            collection_name=self.COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(
                            value=document_id
                        ),
                    )
                ]
            ),
        )

    def collection_info(self) -> dict[str, Any]:
        info = self.client.get_collection(
            collection_name=self.COLLECTION_NAME
        )

        return {
            "collection": self.COLLECTION_NAME,
            "vectors_count": info.points_count,
            "vector_size": self.VECTOR_SIZE,
            "distance": "COSINE",
        }


vector_store = VectorStore()