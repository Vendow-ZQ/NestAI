"""Image upload API."""

import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.services.storage_service import get_storage_service

router = APIRouter(prefix="/api/upload", tags=["upload"])
settings = get_settings()


@router.post("", include_in_schema=False)
@router.post("/")
async def upload_images(images: List[UploadFile] = File(...)):
    """Upload one or more images and return frontend-safe URLs."""
    try:
        storage = get_storage_service()
        today = datetime.utcnow().strftime("%Y%m%d")
        urls = []

        for image in images:
            if image.content_type and not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail=f"Invalid file type: {image.content_type}")

            file_ext = Path(image.filename or "").suffix.lower()
            if file_ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
                file_ext = ".jpg"

            content = await image.read()
            if len(content) > settings.max_upload_size:
                raise HTTPException(status_code=400, detail=f"File too large: {image.filename}")

            object_path = f"{today}/{uuid.uuid4().hex}{file_ext}"
            urls.append(storage.save_bytes(object_path, content, image.content_type))

        return JSONResponse({"success": True, "data": {"urls": urls, "count": len(urls)}})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
