"""
文件上传API - 处理图片上传
"""

import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List

from app.core.config import get_settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

settings = get_settings()


@router.post("/")
async def upload_images(images: List[UploadFile] = File(...)):
    """
    上传图片到服务器
    返回图片URL列表
    """
    try:
        # 确保上传目录存在
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 生成日期子目录
        today = datetime.now().strftime("%Y%m%d")
        date_dir = upload_dir / today
        date_dir.mkdir(exist_ok=True)

        urls = []
        for image in images:
            # 验证文件类型
            if not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {image.content_type}"
                )

            # 生成唯一文件名
            file_ext = Path(image.filename).suffix.lower()
            if file_ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                file_ext = '.jpg'

            file_name = f"{uuid.uuid4().hex}{file_ext}"
            file_path = date_dir / file_name

            # 保存文件
            with open(file_path, "wb") as f:
                content = await image.read()
                # 检查文件大小
                if len(content) > settings.max_upload_size:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File too large: {image.filename}"
                    )
                f.write(content)

            # 构建URL
            file_url = f"/uploads/{today}/{file_name}"
            urls.append(file_url)

        return JSONResponse({
            "success": True,
            "data": {
                "urls": urls,
                "count": len(urls)
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
