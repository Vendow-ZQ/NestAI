"""
空间管理API - 创建和管理空间
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/spaces", tags=["spaces"])


# 模拟内存存储（实际应该使用数据库）
spaces_db = {}


class CreateSpaceRequest(BaseModel):
    images: List[str]
    userId: Optional[str] = "dev_user"
    name: Optional[str] = None


class SpaceResponse(BaseModel):
    id: str
    userId: str
    images: List[str]
    name: Optional[str]
    createdAt: str


@router.post("/")
async def create_space(req: CreateSpaceRequest):
    """
    创建新空间
    对应前端：上传图片后创建space记录
    """
    try:
        space_id = str(uuid.uuid4())

        space_data = {
            "id": space_id,
            "userId": req.userId,
            "images": req.images,
            "name": req.name or f"空间 {datetime.now().strftime('%m%d')}",
            "createdAt": datetime.utcnow().isoformat()
        }

        # 存储到内存（生产环境应该用数据库）
        spaces_db[space_id] = space_data

        return JSONResponse({
            "success": True,
            "data": space_data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{space_id}")
async def get_space(space_id: str):
    """获取空间详情"""
    if space_id not in spaces_db:
        raise HTTPException(status_code=404, detail="Space not found")

    return JSONResponse({
        "success": True,
        "data": spaces_db[space_id]
    })


@router.get("/")
async def list_spaces(userId: Optional[str] = "dev_user"):
    """获取用户的所有空间"""
    user_spaces = [
        space for space in spaces_db.values()
        if space["userId"] == userId
    ]

    return JSONResponse({
        "success": True,
        "data": user_spaces
    })
