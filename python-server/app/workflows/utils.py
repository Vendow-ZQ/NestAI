import base64
import json
import mimetypes
import re
from pathlib import Path
from typing import Any, Dict

from app.core.config import BASE_DIR, get_settings

from .state import NestAIState


LEVEL_DEFAULTS = {
    "free": ("0 元调整", "0 元", "约 10 分钟"),
    "low": ("低成本微调", "100 元以内", "约 30 分钟"),
    "advanced": ("进阶改造", "300 元以内", "约 45 分钟"),
}


def load_prompt4() -> str:
    project_root = Path(__file__).resolve().parents[3]
    prompt_path = project_root / "prompts" / "P004_image_prompt.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8").strip()

    return (
        "Turn the selected intervention tier into a realistic image-to-image edit prompt. "
        "Keep the original room recognizable and apply only the selected tier changes."
    )


def resolve_upload_path(image_url: str) -> Path:
    settings = get_settings()
    upload_root = Path(settings.upload_dir)
    upload_root = upload_root if upload_root.is_absolute() else BASE_DIR / upload_root
    relative = image_url[len("/uploads/"):] if image_url.startswith("/uploads/") else image_url
    return upload_root / relative


def image_url_to_data_url(image_url: str) -> str:
    path = resolve_upload_path(image_url)
    mime_type = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def intervention_action_text(level: str, plan: Dict[str, Any], state: NestAIState) -> str:
    return json.dumps(
        {
            "selected_tier": level,
            "title": plan.get("title", ""),
            "diagnosis": plan.get("diagnosis", ""),
            "changes": plan.get("changes") or [],
            "first_steps": plan.get("firstSteps") or [],
            "recommendations": plan.get("recommendations") or [],
            "estimated_time": plan.get("estimatedTime", ""),
            "cost_range": plan.get("costRange", ""),
            "memory01_excerpt": (state.get("space_summary") or "")[:1200],
            "long_term_memory_compact": (state.get("long_term_context") or "")[:1200],
            "aspiration": state.get("aspiration") or [],
            "current_state": state.get("current_state") or [],
            "constraints": state.get("constraints") or {},
        },
        ensure_ascii=False,
        indent=2,
    )


def extract_json_object(text: str) -> Dict[str, Any]:
    """Parse a JSON object from raw LLM text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))

    loose = re.search(r"\{.*\}", text, re.DOTALL)
    if loose:
        return json.loads(loose.group())

    raise ValueError("No JSON object found in model response")


def build_image_prompts(level: str, plan: Dict[str, Any], state: NestAIState) -> Dict[str, str]:
    """Build provider-neutral image prompts from memory, questionnaire, and plan."""
    space_summary = (state.get("space_summary") or "")[:900]
    long_term_context = (state.get("long_term_context") or "")[:900]
    aspiration = " / ".join(state.get("aspiration") or [])
    current_state = " / ".join(state.get("current_state") or [])
    changes = " / ".join(plan.get("changes") or [])
    first_steps = " / ".join(plan.get("firstSteps") or [])
    recommendations = json.dumps(plan.get("recommendations") or [], ensure_ascii=False)

    selected_intervention = (
        f"Selected tier: {level}. "
        f"Selected plan title: {plan.get('title', '')}. "
        f"Observed space and personality cues: {space_summary}. "
        f"Long-term user memory cues: {long_term_context}. "
        f"Desired lifestyle: {aspiration}. Current friction: {current_state}. "
        f"Visible intervention changes: {changes}. First steps: {first_steps}. "
        f"Recommended objects or constraints: {recommendations}."
    )
    base_xml = f"""<image_edit_prompt id="P004-{level}-fallback">
  <task>
    Edit the provided input image into a photorealistic after-image based on the selected NestAI intervention.
  </task>
  <source_image_interpretation>
    Use the input image as the fixed visual base. Preserve the original camera angle, perspective, room proportions, major furniture layout, object scale, and recognizable identity of the space.
  </source_image_interpretation>
  <must_preserve>
    <item>Do not change wall positions, wall openings, room boundaries, ceiling height, windows, doors, ceiling, or floor structure.</item>
    <item>Do not expand the room or create impossible extra space.</item>
    <item>Keep the visual result recognizably the same room.</item>
  </must_preserve>
  <selected_intervention>
    {selected_intervention}
  </selected_intervention>
  <rendering_requirements>
    <item>Photorealistic interior image edit.</item>
    <item>Natural lighting and realistic materials consistent with the original photo.</item>
    <item>Warm, practical, achievable, lived-in result rather than a luxury showroom.</item>
    <item>Output only the transformed after-image.</item>
  </rendering_requirements>
  <negative_constraints>
    No unrealistic architecture, no extra windows, no impossible room expansion, no people, no text, no watermark, no unrelated decor, no over-styled showroom.
  </negative_constraints>
  <final_instruction>
    Edit the input image directly according to the selected intervention while preserving the original space structure.
  </final_instruction>
</image_edit_prompt>"""

    return {
        "axonometric": base_xml.replace('id="P004-' + level + '-fallback"', 'id="P004-' + level + '-axonometric"'),
        "render1": base_xml.replace('id="P004-' + level + '-fallback"', 'id="P004-' + level + '-render1"'),
        "render2": base_xml.replace('id="P004-' + level + '-fallback"', 'id="P004-' + level + '-render2"'),
        "negative": "no unrealistic architecture, no extra windows, no impossible room expansion, no text watermark, no over-styled showroom",
    }


def fallback_intervention_plan(state: NestAIState) -> Dict[str, Any]:
    aspiration = "、".join(state.get("aspiration") or []) or "更靠近想要的生活状态"
    current_state = "、".join(state.get("current_state") or []) or "空间还没有完全支持你的日常"
    constraints = state.get("constraints") or {}
    budget = constraints.get("budget") or "预算有限"

    base_diagnosis = (
        f"我看到你想要的是{aspiration}，但现在更常发生的是{current_state}。"
        "这不需要一下子改造成另一个房间，先让一个角落变得更顺手，就已经是改变的开始。"
    )

    return {
        "free": {
            "level": "free",
            "title": LEVEL_DEFAULTS["free"][0],
            "changes": ["清出一个固定的空白工作面", "把线材和零碎物放进同一位置", "只保留今晚会用到的物品"],
            "diagnosis": base_diagnosis,
            "firstSteps": ["把桌面中央清出一块 A4 大小的空白", "把线材收进抽屉或靠墙一侧", "把今晚不用的物品移出视线"],
            "recommendations": [],
            "estimatedTime": LEVEL_DEFAULTS["free"][2],
            "costRange": LEVEL_DEFAULTS["free"][1],
        },
        "low": {
            "level": "low",
            "title": LEVEL_DEFAULTS["low"][0],
            "changes": ["增加一个桌面收纳托盘", "补一盏暖光台灯", "用小挂钩固定床边常用物"],
            "diagnosis": f"{base_diagnosis} 在{budget}的约束里，低成本物件应该只服务于秩序、光线和顺手。",
            "firstSteps": ["先完成 0 元整理", "选择一个托盘收纳桌面零碎物", "把冷白光使用场景和休息场景分开"],
            "recommendations": [{"name": "桌面收纳托盘", "price": "约 30 元"}, {"name": "3000K 暖光台灯", "price": "约 60 元"}],
            "estimatedTime": LEVEL_DEFAULTS["low"][2],
            "costRange": LEVEL_DEFAULTS["low"][1],
        },
        "advanced": {
            "level": "advanced",
            "title": LEVEL_DEFAULTS["advanced"][0],
            "changes": ["重新定义学习、休息、收纳三区", "增加墙面或立面表达", "用灯光和软装形成更稳定的生活节奏"],
            "diagnosis": f"{base_diagnosis} 进阶方案的重点不是买更多东西，而是让每个角落只承担一类生活动作。",
            "firstSteps": ["画出学习、休息、收纳三个区域", "决定一个可以表达自己的墙面或立面", "补齐灯光、收纳、软装中最缺的一项"],
            "recommendations": [{"name": "墙面海报或软木板", "price": "约 50 元"}, {"name": "小地毯或靠垫", "price": "约 80 元"}],
            "estimatedTime": LEVEL_DEFAULTS["advanced"][2],
            "costRange": LEVEL_DEFAULTS["advanced"][1],
        },
    }


def normalize_intervention_plan(plan: Dict[str, Any], state: NestAIState) -> Dict[str, Any]:
    fallback = fallback_intervention_plan(state)
    normalized: Dict[str, Any] = {}

    for level in ("free", "low", "advanced"):
        source = plan.get(level) if isinstance(plan, dict) else None
        if not isinstance(source, dict):
            source = {}

        merged = {**fallback[level], **source, "level": level}
        for key in ("changes", "firstSteps", "recommendations"):
            if not isinstance(merged.get(key), list):
                merged[key] = fallback[level][key]

        if not isinstance(merged.get("imagePrompts"), dict):
            merged["imagePrompts"] = build_image_prompts(level, merged, state)

        normalized[level] = merged

    return normalized


def fallback_letter(state: NestAIState) -> str:
    selected_level = state.get("selected_level") or "low"
    return (
        "我记住的不是你完成了多少步骤，而是你真的回到自己的空间里，试着让它更靠近你一点。\n\n"
        f"这次你选择的是 {selected_level} 方案。哪怕只是挪开一些东西、留出一点空白、换一种光线，"
        "它都在告诉这个房间：这里不只是被使用的地方，也是你可以慢慢安放自己的地方。\n\n"
        "如果有些步骤还没做到，也没关系。空间的改变不需要一次完成，它更像是一种很轻的对话："
        "你动一点，它回应一点。"
    )
