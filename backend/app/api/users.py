"""User identity API.

This is intentionally lightweight: a local product account that anchors spaces,
session memory, and long-term memory without introducing OAuth or paid auth
infrastructure.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services.memory_service import MemoryService, UserModel, get_db

router = APIRouter(prefix="/api/users", tags=["users"])


class LoginRequest(BaseModel):
    displayName: str = Field(default="NestAI User", min_length=1, max_length=80)
    email: Optional[str] = Field(default=None, max_length=160)
    avatarUrl: Optional[str] = None


def serialize_user(user: UserModel, memory_service: MemoryService) -> dict:
    return {
        "id": user.id,
        "displayName": user.display_name or "NestAI User",
        "email": user.email or "",
        "avatarUrl": user.avatar_url or "",
        "profileSummary": user.profile_summary or "",
        "longTermMemoryPath": str(memory_service.get_long_term_memory_path(user.id)),
        "createdAt": user.created_at.isoformat() if user.created_at else "",
        "updatedAt": user.updated_at.isoformat() if user.updated_at else "",
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Create or reuse a lightweight user and ensure long-term memory exists."""
    memory_service = MemoryService(db)
    user = memory_service.upsert_user(
        display_name=req.displayName,
        email=req.email,
        avatar_url=req.avatarUrl,
    )
    return JSONResponse({
        "success": True,
        "data": serialize_user(user, memory_service),
    })


@router.get("/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    memory_service = MemoryService(db)
    user = memory_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return JSONResponse({
        "success": True,
        "data": serialize_user(user, memory_service),
    })
