from __future__ import annotations

import os

from dotenv import load_dotenv
from google import genai
from google.genai import types


# Load environment variables from backend/fastapi/.env
load_dotenv()


class LLMService:
    """
    Gemini-powered LLM service for NEXORA.

    The service receives retrieved RAG context and
    generates a grounded answer using Gemini.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.8-flash",
        )

        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Add it to backend/fastapi/.env."
            )

        self.client = genai.Client(
            api_key=self.api_key
        )

    def generate_answer(
        self,
        query: str,
        context: str,
    ) -> str:

        query = query.strip()
        context = context.strip()

        if not query:
            raise ValueError(
                "Query cannot be empty."
            )

        if not context:
            raise ValueError(
                "RAG context cannot be empty."
            )

        system_instruction = """
You are NEXORA's enterprise AI assistant.

Answer the user's question using ONLY the
provided document context.

Rules:

1. Do not invent facts.
2. Do not use outside knowledge.
3. If the answer is not present in the context,
   clearly say that the information was not found.
4. Keep the answer concise and professional.
5. Do not expose unrelated information from the
   context.
6. Only mention sensitive personal information
   when it is directly necessary to answer the
   user's question.
7. Never claim information exists in the document
   unless the provided context supports it.
"""

        prompt = f"""
DOCUMENT CONTEXT
----------------
{context}
----------------

USER QUESTION
-------------
{query}

Provide a grounded answer based ONLY on the
document context above.
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=500,
            ),
        )

        answer = (response.text or "").strip()

        if not answer:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return answer


llm_service = LLMService()