from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.document_processor import (
    DocumentProcessingError,
    DocumentProcessor,
)


router = APIRouter(
    prefix="/documents",
    tags=["AI Documents"],
)


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
):
    """
    Extract text and create chunks from an uploaded document.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    content = await file.read()

    try:
        text = DocumentProcessor.extract_text(
            filename=file.filename,
            content=content,
        )

        chunks = DocumentProcessor.chunk_text(text)

        return {
            "success": True,
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(content),
            "text_length": len(text),
            "chunk_count": len(chunks),
            "text": text,
            "chunks": [
                {
                    "index": index,
                    "text": chunk,
                    "length": len(chunk),
                }
                for index, chunk in enumerate(chunks)
            ],
        }

    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {exc}",
        ) from exc