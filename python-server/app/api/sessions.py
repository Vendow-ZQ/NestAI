"""
会话管理API路由 - 对应前端需求
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.services.memory_service import MemoryService, get_db
from app.services.workflow_service import get_workflow_service, WorkflowService

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ============== 数据模型 ==============

class CreateSessionRequest(BaseModel):
    spaceId: str
    userId: Optional[str] = "dev_user"


class AnalyzeResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None


class GenerateInterventionRequest(BaseModel):
    aspiration: List[str]
    current_state: List[str]
    constraints: Dict[str, str]


class GenerateLetterRequest(BaseModel):
    selected_level: str  # tonight, this_week, this_month
    completion_status: str  # 完全做到, 部分做到, 尝试但未完成, 看了但没做
    user_feeling: str


class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str


# ============== API路由 ==============

@router.post("/")
async def create_session(
    req: CreateSessionRequest,
    db: Session = Depends(get_db)
):
    """
    创建新会话
    对应前端：上传图片后创建session
    """
    memory_service = MemoryService(db)

    # 生成session_id
    import uuid
    session_id = str(uuid.uuid4())

    # 创建短期记忆记录
    memory = memory_service.create_session_memory(
        session_id=session_id,
        space_id=req.spaceId,
        user_id=req.userId
    )

    return JSONResponse({
        "success": True,
        "data": {
            "sessionId": session_id,
            "spaceId": req.spaceId,
            "status": memory.status,
            "createdAt": memory.created_at.isoformat()
        }
    })


@router.post("/{session_id}/analyze")
async def analyze_space(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    分析空间图片 (P001)
    对应前端：GeneratingPage调用，type=space
    """
    try:
        memory_service = MemoryService(db)
        workflow_service = get_workflow_service(memory_service)

        # 获取session信息（需要图片描述）
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        # TODO: 获取图片描述（从图片上传服务）
        # 暂时使用占位符，实际应该从空间图片解析
        image_description = f"Space image for {memory.space_id}"

        # 运行空间分析工作流
        result = await workflow_service.run_space_analysis(
            session_id=session_id,
            image_description=image_description
        )

        if result.get("error"):
            return JSONResponse({
                "success": False,
                "error": result["error"]
            }, status_code=500)

        return JSONResponse({
            "success": True,
            "data": {
                "spaceSummary": result["space_summary"],
                "questions": result["questions"]
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    获取会话详情
    对应前端：ChatPage获取分析结果
    """
    try:
        memory_service = MemoryService(db)
        memory = memory_service.get_session_memory(session_id)

        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        import json

        # 解析存储的JSON数据
        space_analysis = {}
        if memory.space_analysis:
            try:
                space_analysis = json.loads(memory.space_analysis)
            except:
                pass

        intervention_plan = {}
        if memory.intervention_plan:
            try:
                intervention_plan = json.loads(memory.intervention_plan)
            except:
                pass

        return JSONResponse({
            "success": True,
            "data": {
                "sessionId": memory.session_id,
                "spaceId": memory.space_id,
                "userId": memory.user_id,
                "status": memory.status,
                "shortTermMemory": memory.content,
                "spaceAnalysis": space_analysis,
                "interventionPlan": intervention_plan,
                "questions": space_analysis.get("questions", []),
                "createdAt": memory.created_at.isoformat(),
                "updatedAt": memory.updated_at.isoformat()
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/intervention")
async def generate_intervention(
    session_id: str,
    req: GenerateInterventionRequest,
    db: Session = Depends(get_db)
):
    """
    生成干预方案 (P002)
    对应前端：用户完成Chat对话后
    """
    try:
        memory_service = MemoryService(db)
        workflow_service = get_workflow_service(memory_service)

        # 检查session是否存在
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        # 运行干预方案生成工作流
        result = await workflow_service.run_intervention_generation(
            session_id=session_id,
            aspiration=req.aspiration,
            current_state=req.current_state,
            constraints=req.constraints
        )

        if result.get("error"):
            return JSONResponse({
                "success": False,
                "error": result["error"]
            }, status_code=500)

        return JSONResponse({
            "success": True,
            "data": {
                "interventionPlan": result["intervention_plan"]
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/letter")
async def generate_letter(
    session_id: str,
    req: GenerateLetterRequest,
    db: Session = Depends(get_db)
):
    """
    生成告别信 (P003)
    对应前端：LetterPage
    """
    try:
        memory_service = MemoryService(db)
        workflow_service = get_workflow_service(memory_service)

        # 检查session是否存在
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        # 运行告别信生成工作流
        result = await workflow_service.run_letter_generation(
            session_id=session_id,
            selected_level=req.selected_level,
            completion_status=req.completion_status,
            user_feeling=req.user_feeling
        )

        if result.get("error"):
            return JSONResponse({
                "success": False,
                "error": result["error"]
            }, status_code=500)

        return JSONResponse({
            "success": True,
            "data": {
                "letter": result["farewell_letter"]
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/letter")
async def get_letter(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    获取已生成的告别信
    """
    try:
        memory_service = MemoryService(db)
        memory = memory_service.get_session_memory(session_id)

        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        return JSONResponse({
            "success": True,
            "data": {
                "letter": memory.letter_content if memory.letter_content else None
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# TODO: 添加健康检查端点
@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "sessions"}
