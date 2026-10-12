from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.document_indexing_service import (
    document_indexing_service,
)
from app.services.document_processor import DocumentProcessingError


router = APIRouter(
    prefix="/documents",
    tags=["AI Document Indexing"],
)


@router.post("/index")
async def index_document(
    document_id: str = Form(...),
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    try:
        result = document_indexing_service.index_document(
            document_id=document_id,
            filename=file.filename,
            content=content,
            metadata={
                "content_type": file.content_type or "application/octet-stream",
            },
        )

        return result

    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document indexing failed: {exc}",
        ) from exc