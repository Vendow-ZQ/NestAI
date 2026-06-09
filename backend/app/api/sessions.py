"""
会话管理API路由 - 对应前端需求
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from sqlalchemy.orm import Session

from app.core.levels import DEFAULT_LEVEL, get_plan_for_level, level_label, normalize_level
from app.services.memory_service import MemoryService, get_db
from app.services.workflow_service import get_workflow_service, WorkflowService
from app.services.vision_service import get_vision_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def create_display_summary(space_summary: str) -> str:
    """Turn internal Memory01 markdown into one user-facing opening sentence."""
    import re

    readable_summary = space_summary or ""
    lowered = readable_summary.lower()
    refusal_markers = (
        "i can't help",
        "i cannot help",
        "i'm sorry",
        "unable to assist",
        "无法协助",
        "无法处理",
        "不能协助",
        "不能处理",
        "抱歉",
    )
    if any(marker in lowered for marker in refusal_markers):
        return "我看见了你的空间。可见线索暂时不够完整，我们先用几个小问题确认你真正想让它支持的生活状态。"

    frontend_label = "\u7ed9\u524d\u7aef\u7684\u4e00\u53e5\u8bdd\u6982\u8ff0"
    one_liner = re.search(rf"##\s*{frontend_label}\s*\n(.+)", readable_summary)
    if one_liner:
        sentence = one_liner.group(1).strip()
        if sentence:
            return f"{sentence} \u5728\u7ee7\u7eed\u4e4b\u524d\uff0c\u6211\u60f3\u518d\u786e\u8ba4\u51e0\u4e2a\u548c\u4f60\u65e5\u5e38\u6709\u5173\u7684\u5c0f\u95ee\u9898\u3002"

    cn_fields = {
        "space_type": re.search(r"-\s*\u7c7b\u578b[:\uff1a]\s*(.+)", readable_summary, re.MULTILINE),
        "density": re.search(r"-\s*\u7269\u54c1\u5bc6\u5ea6[:\uff1a]\s*(.+)", readable_summary, re.MULTILINE),
        "storage": re.search(r"-\s*\u6536\u7eb3\u72b6\u6001[:\uff1a]\s*(.+)", readable_summary, re.MULTILINE),
    }
    cn_parts = [match.group(1).strip() for match in cn_fields.values() if match]
    if cn_parts:
        return f"\u6211\u770b\u89c1\u4e86\u4e00\u4e2a{'、'.join(cn_parts)}\u7684\u7a7a\u95f4\u3002\u5728\u7ee7\u7eed\u4e4b\u524d\uff0c\u6211\u60f3\u518d\u786e\u8ba4\u51e0\u4e2a\u548c\u4f60\u65e5\u5e38\u6709\u5173\u7684\u5c0f\u95ee\u9898\u3002"

    one_liner = re.search(r"##\s*给前端的一句话概述\s*\n(.+)", space_summary or "")
    if one_liner:
        sentence = one_liner.group(1).strip()
        if sentence:
            return f"{sentence} 在继续之前，我想再确认几个和你日常有关的小问题。"

    def extract_cn(pattern: str) -> str:
        match = re.search(pattern, space_summary or "", re.MULTILINE)
        return match.group(1).strip() if match else ""

    cn_space_type = extract_cn(r"-\s*类型[:：]\s*(.+)")
    cn_density = extract_cn(r"-\s*物品密度[:：]\s*(.+)")
    cn_storage = extract_cn(r"-\s*收纳状态[:：]\s*(.+)")

    if cn_space_type or cn_density or cn_storage:
        parts = []
        if cn_space_type:
            parts.append(cn_space_type)
        if cn_density:
            parts.append(f"物品{cn_density}")
        if cn_storage:
            parts.append(cn_storage)
        return f"我看见了一个{'、'.join(parts)}的空间。在继续之前，我想再确认几个和你日常有关的小问题。"

    def extract(pattern: str) -> str:
        match = re.search(pattern, space_summary, re.MULTILINE)
        return match.group(1).strip() if match else ""

    space_type = extract(r"-\s*类型[:：]\s*(.+)")
    item_count = extract(r"-\s*物品总量[:：]\s*(.+)")
    aesthetic = extract(r"-\s*整体品味[:：]\s*(.+)")
    color = extract(r"-\s*色彩[:：]\s*(.+)")

    if space_type or item_count or aesthetic or color:
        parts = []
        if space_type:
            parts.append(f"一个{space_type}")
        if item_count:
            parts.append(f"物品{item_count}")
        if aesthetic:
            parts.append(aesthetic.rstrip("。"))
        elif color:
            parts.append(color.rstrip("。"))

        return f"我看见了{ '，'.join(parts) }。在继续之前，我想再确认几个和你日常有关的小问题。"

    compact = re.sub(r"#+\s*", "", space_summary)
    compact = re.sub(r"\s+", " ", compact).strip()
    if compact:
        return f"我看见了你的空间：{compact[:80]}。在继续之前，我想再确认几个和你日常有关的小问题。"

    return "我看见了你的空间。在继续之前，我想再确认几个和你日常有关的小问题。"


# ============== 数据模型 ==============

class CreateSessionRequest(BaseModel):
    spaceId: str
    userId: Optional[str] = "dev_user"
    images: Optional[List[str]] = []  # 图片URL列表，避免依赖spaces_db


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
    after_images: Optional[List[str]] = []
    unfinished_steps: Optional[List[str]] = []


class GenerateImagesRequest(BaseModel):
    level: Optional[str] = DEFAULT_LEVEL
    tabs: Optional[List[str]] = None


class PublishFeedRequest(BaseModel):
    level: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    lifestyle_keywords: Optional[List[str]] = None


class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str


def safe_json_loads(value: Optional[str], default: Any):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def is_frontend_questionnaire(value: Any) -> bool:
    if not isinstance(value, list) or len(value) != 3:
        return False
    for item in value:
        if not isinstance(item, dict):
            return False
        if not isinstance(item.get("q"), str) or not item["q"].strip():
            return False
        options = item.get("options")
        if not isinstance(options, list) or len(options) != 4:
            return False
        if any(not isinstance(option, str) or not option.strip() for option in options):
            return False
    return True


def build_next_action_from_plan(memory) -> Optional[Dict[str, Any]]:
    intervention_plan = safe_json_loads(memory.intervention_plan, {})
    space_analysis = safe_json_loads(memory.space_analysis, {})
    feedback = safe_json_loads(memory.feedback, {})

    selected_level = normalize_level(feedback.get("selected_level") or DEFAULT_LEVEL)
    plan = get_plan_for_level(intervention_plan, selected_level, None)
    if not isinstance(plan, dict):
        return None

    first_steps = plan.get("firstSteps") or []
    images = space_analysis.get("images") or []

    return {
        "id": f"next-{memory.session_id}-{selected_level}",
        "sessionId": memory.session_id,
        "title": plan.get("title") or "继续改造这个空间",
        "spaceName": "我的空间",
        "lifestyleGoal": plan.get("diagnosis") or "让空间更靠近想要的生活状态",
        "firstStep": first_steps[0] if first_steps else "先选择一个最小动作开始",
        "estimatedTime": plan.get("estimatedTime") or "约 10 分钟",
        "costRange": plan.get("costRange") or level_label(selected_level),
        "previewImage": plan.get("afterImage") or (images[0] if images else ""),
        "completed": memory.status in ("feedback_done", "letter_done"),
        "interventionId": f"{memory.session_id}-{selected_level}",
        "level": selected_level,
        "sceneId": memory.space_id,
    }

def list_feed_seed_images() -> List[str]:
    from pathlib import Path

    from app.core.config import get_settings

    seed_dir = Path(get_settings().upload_dir) / "feed-seed"
    if not seed_dir.exists():
        return []

    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    return [
        f"/uploads/feed-seed/{path.name}"
        for path in sorted(seed_dir.iterdir())
        if path.is_file() and path.suffix.lower() in allowed
    ]


def pick_feed_image(memory, images: List[str], seed_images: List[str]) -> str:
    import hashlib

    key = memory.session_id or memory.user_id or ""
    index_seed = int(hashlib.sha1(key.encode("utf-8")).hexdigest()[:8], 16)
    if images:
        return images[index_seed % len(images)]
    if seed_images:
        return seed_images[index_seed % len(seed_images)]
    return ""


def display_user_name(user_id: str) -> str:
    if not user_id or user_id == "dev_user":
        return "NestAI User"
    compact = user_id.replace("_", " ").replace("-", " ").strip()
    return compact.title() if compact else "NestAI User"


def build_feed_item_from_session(memory, seed_images: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
    space_analysis = safe_json_loads(memory.space_analysis, {})
    intervention_plan = safe_json_loads(memory.intervention_plan, {})
    feedback = safe_json_loads(memory.feedback, {})
    own_images = feedback.get("after_images") or []
    if not own_images and not seed_images:
        own_images = space_analysis.get("images") or []

    if not space_analysis and not intervention_plan:
        return None

    display_summary = space_analysis.get("display_summary") or space_analysis.get("summary") or "一个正在被重新理解的空间"
    title = "我的空间变化"
    if isinstance(intervention_plan, dict):
        default_plan = get_plan_for_level(intervention_plan, DEFAULT_LEVEL, {}) or {}
        if isinstance(default_plan, dict) and default_plan.get("title"):
            title = default_plan["title"]

    return {
        "id": f"feed-{memory.session_id}",
        "sessionId": memory.session_id,
        "userId": memory.user_id,
        "userName": display_user_name(memory.user_id),
        "userAvatar": "",
        "title": title,
        "description": display_summary[:120],
        "image": pick_feed_image(memory, own_images, seed_images or []),
        "location": "NestAI",
        "lifestyleKeywords": ["空间", "生活方式"],
        "createdAt": memory.updated_at.isoformat(),
    }


# ============== API路由 ==============

def build_feed_item_from_post(post) -> Dict[str, Any]:
    session_id = None
    session_prefix = "feed-session-"
    if isinstance(post.id, str) and post.id.startswith(session_prefix):
        session_id = post.id[len(session_prefix):]

    return {
        "id": post.id,
        "sessionId": session_id,
        "userId": post.user_id,
        "userName": post.user_name,
        "userAvatar": post.user_avatar,
        "title": post.title,
        "description": post.description,
        "image": post.image_url,
        "location": post.location,
        "lifestyleKeywords": safe_json_loads(post.lifestyle_keywords, []),
        "createdAt": post.created_at.isoformat(),
    }


def first_text(value: Any, fallback: str = "") -> str:
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item.strip():
                return item.strip()
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def select_publish_image(
    requested_image: Optional[str],
    feedback: Dict[str, Any],
    plan: Dict[str, Any],
    space_analysis: Dict[str, Any],
) -> str:
    if requested_image:
        return requested_image

    after_images = feedback.get("after_images") if isinstance(feedback, dict) else []
    if isinstance(after_images, list) and after_images:
        return after_images[0]

    generated_images = plan.get("generatedImages") if isinstance(plan, dict) else {}
    if isinstance(generated_images, dict):
        for key in ("render1", "render2", "axonometric"):
            if generated_images.get(key):
                return generated_images[key]
        for value in generated_images.values():
            if isinstance(value, str) and value:
                return value

    if isinstance(plan, dict) and plan.get("afterImage"):
        return plan["afterImage"]

    images = space_analysis.get("images") if isinstance(space_analysis, dict) else []
    if isinstance(images, list) and images:
        return images[0]

    return ""


@router.post("", include_in_schema=False)
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
    user_id = req.userId or "dev_user"
    if not memory_service.get_long_term_memory(user_id):
        memory_service.create_long_term_memory(user_id)

    memory = memory_service.create_session_memory(
        session_id=session_id,
        space_id=req.spaceId,
        user_id=user_id
    )

    # 保存图片URL到session（避免依赖内存中的spaces_db）
    if req.images:
        memory_service.update_session_field(
            session_id,
            "space_analysis",
            {"images": req.images, "summary": "", "questions": []}
        )

    return JSONResponse({
        "success": True,
        "data": {
            "id": session_id,
            "spaceId": req.spaceId,
            "status": memory.status,
            "createdAt": memory.created_at.isoformat()
        }
    })


@router.post("/{session_id}/analyze")
async def analyze_space(
    session_id: str,
    force: bool = Query(False, description="Re-run P001 image analysis even when cached questions exist."),
    db: Session = Depends(get_db)
):
    """
    分析空间图片 (P001)
    对应前端：GeneratingPage调用，type=space
    使用多模态视觉模型分析图片
    """
    try:
        import json

        memory_service = MemoryService(db)

        # 获取session信息
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        # 获取空间图片URL（从session的space_analysis字段获取）
        image_urls = []
        if memory.space_analysis:
            try:
                analysis_data = json.loads(memory.space_analysis)
                image_urls = analysis_data.get("images", [])
            except:
                pass

        if not image_urls:
            raise HTTPException(status_code=400, detail="No images found for this space")

        if not force and memory.status == "analyzed" and memory.space_analysis:
            try:
                existing = json.loads(memory.space_analysis)
                existing_questions = existing.get("questions", [])
                if is_frontend_questionnaire(existing_questions):
                    return JSONResponse({
                        "success": True,
                        "data": {
                            "spaceSummary": existing.get("display_summary") or create_display_summary(existing.get("summary", "")),
                            "questions": existing_questions
                        }
                    })
            except Exception:
                pass

        print(f"Analyzing {len(image_urls)} images for session {session_id}")

        # 使用视觉服务分析图片
        vision_service = get_vision_service()
        long_term_context = memory_service.get_compact_long_term_memory(memory.user_id)
        result = await vision_service.analyze_space_image(
            image_urls=image_urls,
            space_id=memory.space_id,
            long_term_context=long_term_context
        )

        # 保存结果到数据库（保留原有的images + 新的人格洞察数据）
        if result.get("space_summary"):
            import json
            analysis_data = {
                "summary": result["space_summary"],
                "display_summary": create_display_summary(result["space_summary"]),
                "questions": result.get("questions", []),
                "qa_markdown": result.get("qa_markdown", ""),  # 完整QA markdown
                "personality_insights": result.get("personality_insights", {}),
                "images": image_urls  # 保留图片URL
            }
            memory_service.update_session_field(
                session_id,
                "space_analysis",
                analysis_data
            )
            memory_service.update_session_status(session_id, "analyzed")

            # 同时保存人格洞察到单独的长期记忆字段
            if result.get("personality_insights"):
                memory_service.append_to_session_memory(
                    session_id,
                    f"## 人格洞察摘要\n{result['space_summary'][:500]}...",
                    "personality_analysis"
                )

        if result.get("error"):
            print(f"Vision analysis returned error: {result['error']}")
            # 即使有错误也返回默认问题，让流程继续

        return JSONResponse({
            "success": True,
            "data": {
                "spaceSummary": create_display_summary(result["space_summary"]),
                "questions": result["questions"]
            }
        })

    except Exception as e:
        import traceback, sys
        error_detail = f"Analyze error: {str(e)}\n{traceback.format_exc()}"
        sys.stderr.write(error_detail)
        sys.stderr.flush()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", include_in_schema=False)
@router.get("/")
async def list_sessions(
    userId: Optional[str] = "dev_user",
    db: Session = Depends(get_db)
):
    """List persisted sessions and derive lightweight feed/next data."""
    memory_service = MemoryService(db)
    user_id = userId or "dev_user"
    if not memory_service.get_long_term_memory(user_id):
        memory_service.create_long_term_memory(user_id)
    memories = memory_service.list_session_memories(user_id)
    feed_posts = memory_service.list_feed_posts()
    public_memories = memory_service.list_public_session_memories()
    seed_images = list_feed_seed_images()

    sessions = []
    feed = []
    next_actions = []

    for memory in memories:
        space_analysis = safe_json_loads(memory.space_analysis, {})
        intervention_plan = safe_json_loads(memory.intervention_plan, {})
        feedback = safe_json_loads(memory.feedback, {})

        sessions.append({
            "sessionId": memory.session_id,
            "spaceId": memory.space_id,
            "userId": memory.user_id,
            "status": memory.status,
            "spaceAnalysis": space_analysis,
            "interventionPlan": intervention_plan,
            "feedback": feedback,
            "letter": memory.letter_content if memory.letter_content else None,
            "createdAt": memory.created_at.isoformat(),
            "updatedAt": memory.updated_at.isoformat(),
        })

        action = build_next_action_from_plan(memory)
        if action:
            next_actions.append(action)

    feed = [build_feed_item_from_post(post) for post in feed_posts]

    if not feed:
        for memory in public_memories:
            feed_item = build_feed_item_from_session(memory, seed_images)
            if feed_item:
                feed.append(feed_item)

    return JSONResponse({
        "success": True,
        "data": {
            "sessions": sessions,
            "feed": feed,
            "nextActions": next_actions,
        },
    })


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "sessions"}


@router.get("/debug/config")
async def test_config():
    """Test runtime LLM configuration loading."""
    import os
    from app.core.config import load_llm_configs, get_default_llm_config

    result = {
        "cwd": os.getcwd(),
        "openai_key_exists": "OPENAI_API_KEY" in os.environ,
        "configs_loaded": list(load_llm_configs().keys()),
        "default_config": None
    }

    default = get_default_llm_config()
    if default:
        result["default_config"] = {
            "name": default.name,
            "api_key_preview": default.api_key[:10] + "..." if default.api_key else "EMPTY",
            "type": default.type
        }

    return result


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
                if space_analysis.get("summary") and not space_analysis.get("display_summary"):
                    space_analysis["display_summary"] = create_display_summary(space_analysis["summary"])
            except:
                pass

        intervention_plan = {}
        if memory.intervention_plan:
            try:
                intervention_plan = json.loads(memory.intervention_plan)
            except:
                pass

        # 构建响应数据
        response_data = {
            "sessionId": memory.session_id,
            "spaceId": memory.space_id,
            "userId": memory.user_id,
            "status": memory.status,
            "shortTermMemory": memory.content,
            "spaceAnalysis": space_analysis,
            "interventionPlan": intervention_plan,
            "feedback": json.loads(memory.feedback) if memory.feedback else {},
            "letter": memory.letter_content if memory.letter_content else None,
            "questions": space_analysis.get("questions", []),
            "createdAt": memory.created_at.isoformat(),
            "updatedAt": memory.updated_at.isoformat()
        }

        # 如果有人格洞察数据，添加到响应
        if "personality_insights" in space_analysis:
            response_data["personalityInsights"] = space_analysis["personality_insights"]

        # 如果有QA markdown，也返回（供前端展示用）
        if "qa_markdown" in space_analysis:
            response_data["qaMarkdown"] = space_analysis["qa_markdown"]

        return JSONResponse({
            "success": True,
            "data": response_data
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

        if result.get("error") and not result.get("intervention_plan"):
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


@router.post("/{session_id}/generate-images")
async def generate_images(
    session_id: str,
    req: GenerateImagesRequest,
    db: Session = Depends(get_db)
):
    """
    Translate the selected intervention tier into image-edit prompts and generate real preview images.
    """
    try:
        memory_service = MemoryService(db)
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        workflow_service = get_workflow_service(memory_service)
        level = normalize_level(req.level or DEFAULT_LEVEL)
        result = await workflow_service.run_image_generation(session_id, level, req.tabs or ["render1"])
        intervention_plan = result.get("intervention_plan") or {}
        plan = get_plan_for_level(intervention_plan, level, None)
        if not isinstance(plan, dict):
            raise HTTPException(status_code=400, detail="No intervention plan found")

        generated_images = result.get("generated_images") or {}

        return JSONResponse({
            "success": True,
            "data": {
                "status": "generated" if generated_images else "failed",
                "level": level,
                "imagePrompts": result.get("image_prompts") or plan.get("imagePrompts", {}),
                "generatedImages": generated_images,
                "interventionPlan": intervention_plan,
                "message": "Images generated." if generated_images else (result.get("error") or "Image generation failed."),
            },
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/publish-feed")
async def publish_session_to_feed(
    session_id: str,
    req: PublishFeedRequest,
    db: Session = Depends(get_db)
):
    """Persist the current session's visible result as a real Grow feed post."""
    try:
        memory_service = MemoryService(db)
        memory = memory_service.get_session_memory(session_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Session not found")

        space_analysis = safe_json_loads(memory.space_analysis, {})
        intervention_plan = safe_json_loads(memory.intervention_plan, {})
        feedback = safe_json_loads(memory.feedback, {})

        level = normalize_level(req.level or feedback.get("selected_level") or DEFAULT_LEVEL)
        plan = {}
        if isinstance(intervention_plan, dict):
            plan = get_plan_for_level(intervention_plan, level, {}) or {}
        if not isinstance(plan, dict):
            plan = {}

        image_url = select_publish_image(req.image, feedback, plan, space_analysis)
        if not image_url:
            raise HTTPException(status_code=400, detail="No image found to publish")

        title = req.title or plan.get("title") or "我的空间变化"
        description = (
            req.description
            or plan.get("diagnosis")
            or space_analysis.get("display_summary")
            or space_analysis.get("summary")
            or first_text(memory.letter_content, "一次真实完成的空间行动。")
        )
        if isinstance(description, str):
            description = description.replace("\n", " ").strip()[:180]

        keywords = req.lifestyle_keywords
        if not keywords:
            keywords = ["空间", "Next", str(level)]

        post = memory_service.upsert_feed_post({
            "id": f"feed-session-{session_id}",
            "user_id": memory.user_id,
            "user_name": display_user_name(memory.user_id),
            "user_avatar": "",
            "title": title,
            "description": description,
            "image_url": image_url,
            "location": "Shared from Letter",
            "lifestyle_keywords": keywords,
            "status": "published",
            "source": "letter",
        })

        return JSONResponse({
            "success": True,
            "data": build_feed_item_from_post(post),
        })
    except HTTPException:
        raise
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

        feedback_data = {
            "selected_level": normalize_level(req.selected_level),
            "selected_level_label": level_label(req.selected_level),
            "completion_status": req.completion_status,
            "user_feeling": req.user_feeling,
            "after_images": req.after_images or [],
            "unfinished_steps": req.unfinished_steps or []
        }
        memory_service.update_session_field(session_id, "feedback", feedback_data)

        enriched_feeling = req.user_feeling
        if req.after_images:
            enriched_feeling += f"\n\n用户上传了变化后的图片：{', '.join(req.after_images)}"
        if req.unfinished_steps:
            enriched_feeling += f"\n\n用户提到还没做到：{'、'.join(req.unfinished_steps)}"

        # 运行告别信生成工作流
        result = await workflow_service.run_letter_generation(
            session_id=session_id,
            selected_level=normalize_level(req.selected_level),
            completion_status=req.completion_status,
            user_feeling=enriched_feeling
        )

        if result.get("error") and not result.get("farewell_letter"):
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


@router.get("/debug/config")
async def test_config():
    """测试配置加载"""
    import os
    from app.core.config import load_llm_configs, get_default_llm_config

    result = {
        "cwd": os.getcwd(),
        "openai_key_exists": "OPENAI_API_KEY" in os.environ,
        "configs_loaded": list(load_llm_configs().keys()),
        "default_config": None
    }

    default = get_default_llm_config()
    if default:
        result["default_config"] = {
            "name": default.name,
            "api_key_preview": default.api_key[:10] + "..." if default.api_key else "EMPTY",
            "type": default.type
        }

    return result
