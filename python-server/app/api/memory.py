"""Memory API for user-facing long-term memory."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.services.memory_service import MemoryService, get_db

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/long-term")
async def get_long_term_memory(userId: Optional[str] = "dev_user", db: Session = Depends(get_db)):
    """Return the Markdown long-term memory and the compact prompt version."""
    try:
        memory_service = MemoryService(db)
        user_id = userId or "dev_user"
        markdown = memory_service.get_long_term_memory_markdown(user_id)
        compact = memory_service.get_compact_long_term_memory(user_id)
        path = memory_service.get_long_term_memory_path(user_id)

        return JSONResponse({
            "success": True,
            "data": {
                "userId": user_id,
                "markdown": markdown,
                "compact": compact,
                "path": str(path),
            },
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
