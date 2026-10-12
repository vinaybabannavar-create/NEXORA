from __future__ import annotations

from functools import lru_cache

from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """
    Generates semantic embeddings for NEXORA documents.

    Default model:
    all-MiniLM-L6-v2

    Embedding dimension:
    384
    """

    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION = 384

    def __init__(self) -> None:
        self.model = self._load_model()

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_model() -> SentenceTransformer:
        """
        Load the embedding model once and reuse it.
        """

        print(
            f"Loading embedding model: "
            f"{EmbeddingService.MODEL_NAME}"
        )

        model = SentenceTransformer(
            EmbeddingService.MODEL_NAME
        )

        print(
            "Embedding model loaded successfully."
        )

        return model

    def embed_text(self, text: str) -> list[float]:
        """
        Generate an embedding for a single text.
        """

        if not text or not text.strip():
            raise ValueError(
                "Text cannot be empty."
            )

        embedding = self.model.encode(
            text,
            normalize_embeddings=True,
        )

        return embedding.tolist()

    def embed_texts(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple text chunks.
        """

        if not texts:
            return []

        cleaned_texts = [
            text.strip()
            for text in texts
            if text and text.strip()
        ]

        if not cleaned_texts:
            return []

        embeddings = self.model.encode(
            cleaned_texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        return embeddings.tolist()

    def dimension(self) -> int:
        """
        Return the embedding vector dimension.
        """

        return self.EMBEDDING_DIMENSION


embedding_service = EmbeddingService()