"""Space management API backed by SQLite."""

import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.memory_service import MemoryService, SpaceModel, get_db

router = APIRouter(prefix="/api/spaces", tags=["spaces"])


class CreateSpaceRequest(BaseModel):
    images: List[str]
    userId: Optional[str] = "dev_user"
    name: Optional[str] = None


def serialize_space(space: SpaceModel) -> dict:
    try:
        images = json.loads(space.images or "[]")
    except json.JSONDecodeError:
        images = []

    return {
        "id": space.id,
        "userId": space.user_id,
        "images": images,
        "name": space.name or f"Space {space.created_at.strftime('%m%d')}",
        "createdAt": space.created_at.isoformat(),
        "updatedAt": space.updated_at.isoformat() if space.updated_at else space.created_at.isoformat(),
    }


@router.post("", include_in_schema=False)
@router.post("/")
async def create_space(req: CreateSpaceRequest, db: Session = Depends(get_db)):
    """Create a persisted space record after image upload."""
    try:
        memory_service = MemoryService(db)
        space = memory_service.create_space(
            space_id=str(uuid.uuid4()),
            images=req.images,
            user_id=req.userId or "dev_user",
            name=req.name,
        )

        return JSONResponse({
            "success": True,
            "data": serialize_space(space),
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{space_id}")
async def get_space(space_id: str, db: Session = Depends(get_db)):
    """Get one persisted space."""
    memory_service = MemoryService(db)
    space = memory_service.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    return JSONResponse({
        "success": True,
        "data": serialize_space(space),
    })


@router.get("", include_in_schema=False)
@router.get("/")
async def list_spaces(userId: Optional[str] = "dev_user", db: Session = Depends(get_db)):
    """List spaces for a user."""
    memory_service = MemoryService(db)
    spaces = memory_service.list_spaces(userId or "dev_user")

    return JSONResponse({
        "success": True,
        "data": [serialize_space(space) for space in spaces],
    })
