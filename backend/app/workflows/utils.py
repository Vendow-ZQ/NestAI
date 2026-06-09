import json
import mimetypes
import re
from pathlib import Path
from typing import Any, Dict

from app.core.levels import BUDGET_LEVELS, DEFAULT_LEVEL, get_plan_for_level, level_label, normalize_level
from app.services.storage_service import get_storage_service

from .state import NestAIState


LEVEL_DEFAULTS = {
    "low_budget": ("低预算微调", "低预算", "约 20 分钟"),
    "standard_budget": ("标准预算升级", "标准预算", "约 1-2 小时"),
    "sufficient_budget": ("预算充足改造", "预算充足", "半天到一天"),
}


def load_prompt3() -> str:
    project_root = Path(__file__).resolve().parents[3]
    prompt_path = project_root / "prompts" / "P003_Image_Prompt.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8").strip()

    return (
        "Turn the selected intervention tier into a realistic image-to-image edit prompt. "
        "Keep the original room recognizable and apply only the selected tier changes."
    )


def resolve_upload_path(image_url: str) -> Path:
    return get_storage_service().materialize(image_url)


def image_url_to_data_url(image_url: str) -> str:
    import base64

    content, mime_type = get_storage_service().read_bytes(image_url)
    mime_type = mime_type or mimetypes.guess_type(image_url)[0] or "image/jpeg"
    encoded = base64.b64encode(content).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def intervention_action_text(level: str, plan: Dict[str, Any], state: NestAIState) -> str:
    intervention_plan = state.get("intervention_plan") or {}
    canonical_level = normalize_level(level)
    return json.dumps(
        {
            "selected_tier": canonical_level,
            "selected_tier_label": level_label(canonical_level),
            "core_intent": intervention_plan.get("core_intent", ""),
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
    level = normalize_level(level)
    space_summary = (state.get("space_summary") or "")[:900]
    long_term_context = (state.get("long_term_context") or "")[:900]
    aspiration = " / ".join(state.get("aspiration") or [])
    current_state = " / ".join(state.get("current_state") or [])
    changes = " / ".join(plan.get("changes") or [])
    first_steps = " / ".join(plan.get("firstSteps") or [])
    recommendations = json.dumps(plan.get("recommendations") or [], ensure_ascii=False)

    selected_intervention = (
        f"Selected tier: {level_label(level)} ({level}). "
        f"Core intervention intent: {(state.get('intervention_plan') or {}).get('core_intent', '')}. "
        f"Selected plan title: {plan.get('title', '')}. "
        f"Observed space and personality cues: {space_summary}. "
        f"Long-term user memory cues: {long_term_context}. "
        f"Desired lifestyle: {aspiration}. Current friction: {current_state}. "
        f"Visible intervention changes: {changes}. First steps: {first_steps}. "
        f"Recommended objects or constraints: {recommendations}."
    )

    if level == "low_budget":
        style_direction = (
            "Keep the user's existing style and make budget-conscious visual improvements: smarter grouping, clearer "
            "task zones, reused existing objects, and at most 1-2 inexpensive anchors if they are present in the selected "
            "plan, such as a tray, cable clip, small textile, simple lamp, poster, or compact organizer."
        )
    elif level == "standard_budget":
        style_direction = (
            "Choose one clear, feasible style direction that fits the room and user cues: Bauhaus, Memphis, New Chinese, "
            "Industrial, Cream, or Biophilic/greenery. Make it visibly present through palette, lighting, materials, and "
            "2-3 practical anchor objects such as a warm lamp, compact stool/chair, small plant, textile/cushion, tray, "
            "basket, poster, or desk organizer. Keep the room lived-in and recognizable."
        )
    else:
        style_direction = (
            "Choose one strong but realistic style direction that fits the room and user cues: Bauhaus, Memphis, New Chinese, "
            "Industrial, Cream, or Biophilic/greenery. Make the style clearly visible through lighting, palette, materials, "
            "zoning, and 2-3 feasible anchor objects such as a statement chair, layered lamp, plant cluster, rug/textile, "
            "wall accent, modular shelving, or side table. Preserve architecture and major room identity."
        )

    base_xml = f"""<image_edit_prompt id="P003-{level}-fallback">
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
  <style_direction>
    {style_direction}
  </style_direction>
  <rendering_requirements>
    <item>Photorealistic interior image edit.</item>
    <item>Natural lighting and realistic materials consistent with the original photo.</item>
    <item>Make the chosen style direction visibly legible, not just a subtle tidying pass.</item>
    <item>Warm, practical, achievable, lived-in result rather than a luxury showroom.</item>
    <item>Output only the transformed after-image.</item>
  </rendering_requirements>
  <negative_constraints>
    No unrealistic architecture, no extra windows, no impossible room expansion, no people, no text, no watermark, no unrelated decor, no over-styled showroom, no generic hotel room.
  </negative_constraints>
  <final_instruction>
    Edit the input image directly according to the selected intervention while preserving the original space structure.
  </final_instruction>
</image_edit_prompt>"""

    return {
        "axonometric": base_xml.replace('id="P003-' + level + '-fallback"', 'id="P003-' + level + '-axonometric"'),
        "render1": base_xml.replace('id="P003-' + level + '-fallback"', 'id="P003-' + level + '-render1"'),
        "render2": base_xml.replace('id="P003-' + level + '-fallback"', 'id="P003-' + level + '-render2"'),
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
        "core_intent": "让一个高频区域更顺手、更能进入状态",
        "low_budget": {
            "level": "low_budget",
            "title": LEVEL_DEFAULTS["low_budget"][0],
            "changes": ["清出一个固定的启动区", "把线材和零碎物归到同一处", "用现有物品建立收尾位置"],
            "diagnosis": base_diagnosis,
            "firstSteps": ["先把最常坐下的位置清出一块手掌大的空白", "把线材移到靠墙一侧", "选一个现有容器放零碎物"],
            "recommendations": ["优先复用已有容器、杯子、盒子或托盘"],
            "estimatedTime": LEVEL_DEFAULTS["low_budget"][2],
            "costRange": LEVEL_DEFAULTS["low_budget"][1],
        },
        "standard_budget": {
            "level": "standard_budget",
            "title": LEVEL_DEFAULTS["standard_budget"][0],
            "changes": ["增加一个桌面或床边收纳托盘", "补一盏适合使用场景的灯", "用小挂钩或分区件固定常用物"],
            "diagnosis": f"{base_diagnosis} 在{budget}的约束里，标准预算应该让秩序、光线和拿取路径同时变顺。",
            "firstSteps": ["先确定最常用的一个区域", "选择一个托盘收纳零碎物", "把工作/休息的光线使用场景分开"],
            "recommendations": [{"name": "桌面收纳托盘", "price": "约 30-80 元"}, {"name": "3000K 暖光台灯", "price": "约 80-180 元"}],
            "estimatedTime": LEVEL_DEFAULTS["standard_budget"][2],
            "costRange": LEVEL_DEFAULTS["standard_budget"][1],
        },
        "sufficient_budget": {
            "level": "sufficient_budget",
            "title": LEVEL_DEFAULTS["sufficient_budget"][0],
            "changes": ["重新定义学习、休息、收纳三区", "增加墙面或立面表达", "用灯光和软装形成更稳定的生活节奏"],
            "diagnosis": f"{base_diagnosis} 预算充足时，重点不是买更多东西，而是让每个角落更清楚地承担一类生活动作。",
            "firstSteps": ["画出学习、休息、收纳三个区域", "决定一个可以表达自己的墙面或立面", "补齐灯光、收纳、软装中最缺的一项"],
            "recommendations": [{"name": "墙面海报或软木板", "price": "约 80-180 元"}, {"name": "小地毯或靠垫", "price": "约 120-300 元"}],
            "estimatedTime": LEVEL_DEFAULTS["sufficient_budget"][2],
            "costRange": LEVEL_DEFAULTS["sufficient_budget"][1],
        },
    }


def normalize_intervention_plan(plan: Dict[str, Any], state: NestAIState) -> Dict[str, Any]:
    fallback = fallback_intervention_plan(state)
    normalized: Dict[str, Any] = {
        "core_intent": (
            plan.get("core_intent")
            if isinstance(plan, dict) and isinstance(plan.get("core_intent"), str)
            else fallback["core_intent"]
        )
    }

    for level in BUDGET_LEVELS:
        source = get_plan_for_level(plan, level, None)
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
    selected_level = normalize_level(state.get("selected_level") or DEFAULT_LEVEL)
    return (
        "我记住的不是你完成了多少步骤，而是你真的回到自己的空间里，试着让它更靠近你一点。\n\n"
        f"这次你选择的是 {level_label(selected_level)} 方案。哪怕只是挪开一些东西、留出一点空白、换一种光线，"
        "它都在告诉这个房间：这里不只是被使用的地方，也是你可以慢慢安放自己的地方。\n\n"
        "如果有些步骤还没做到，也没关系。空间的改变不需要一次完成，它更像是一种很轻的对话："
        "你动一点，它回应一点。"
    )
