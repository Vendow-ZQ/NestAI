import json
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm_manager import llm_manager
from app.prompts import create_p002_prompt, create_p003_prompt
from app.services.image_generation_service import get_image_generation_service

from .state import NestAIState
from .utils import (
    build_image_prompts,
    extract_json_object,
    fallback_intervention_plan,
    fallback_letter,
    image_url_to_data_url,
    intervention_action_text,
    load_prompt4,
    normalize_intervention_plan,
)


def plan_intervention_node(state: NestAIState) -> NestAIState:
    """Generate the three-level intervention plan from Memory01 and questionnaire answers."""
    try:
        prompt = create_p002_prompt()
        model = llm_manager.get_model()
        constraints = state.get("constraints") or {}

        messages = prompt.format_messages(
            history=[],
            long_term_context=state.get("long_term_context", ""),
            space_summary=state.get("space_summary", ""),
            aspiration=", ".join(state.get("aspiration") or []),
            current_state=", ".join(state.get("current_state") or []),
            sharing=constraints.get("sharing", "未知"),
            budget=constraints.get("budget", "未知"),
            wall_modification=constraints.get("wall_modification", "未知"),
        )

        response = model.invoke(messages)
        raw_plan = extract_json_object(str(response.content))
        state["intervention_plan"] = normalize_intervention_plan(raw_plan, state)
        state["stage"] = "intervention_planned"
        state["error"] = None
    except Exception as e:
        state["intervention_plan"] = normalize_intervention_plan(fallback_intervention_plan(state), state)
        state["stage"] = "intervention_planned"
        state["error"] = f"P002 fallback used: {e}"

    return state


def build_image_prompt_node(state: NestAIState) -> NestAIState:
    """Translate selected action text and the before image into image-edit prompts."""
    plan = state.get("intervention_plan") or {}
    level = state.get("selected_level") or "low"
    selected = plan.get(level) or plan.get("low") or plan.get("free") or {}

    if isinstance(selected, dict):
        prompts = build_image_prompts(level, selected, state)
        source_images = state.get("source_images") or []

        if source_images:
            try:
                model = llm_manager.get_model()
                action_text = intervention_action_text(level, selected, state)
                messages = [
                    SystemMessage(content=load_prompt4()),
                    HumanMessage(
                        content=[
                            {
                                "type": "text",
                                "text": (
                                    "Translate this selected space intervention action text into image-to-image edit prompts. "
                                    "Use the attached before-image as the fixed visual base. Return only JSON.\n\n"
                                    f"{action_text}"
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url_to_data_url(source_images[0])},
                            },
                        ]
                    ),
                ]
                translated = extract_json_object(str(model.invoke(messages).content))
                prompts = {
                    "render1": translated.get("render1") or prompts["render1"],
                    "axonometric": translated.get("axonometric") or prompts["axonometric"],
                    "render2": translated.get("render2") or prompts["render2"],
                    "negative": translated.get("negative") or prompts["negative"],
                }
            except Exception as e:
                state["error"] = f"P004 translation fallback used: {e}"

        selected["imagePrompts"] = prompts
        plan[level] = selected
        state["image_prompts"] = prompts
        state["intervention_plan"] = plan
    else:
        state["image_prompts"] = {}

    state["stage"] = "image_prompts_ready"
    return state


def generate_images_node(state: NestAIState) -> NestAIState:
    """Generate real intervention images through the configured image provider."""
    try:
        prompts = state.get("image_prompts") or {}
        tabs = state.get("image_tabs") or ["render1"]
        source_images = state.get("source_images") or []

        image_service = get_image_generation_service()
        generated = image_service.generate_from_original(
            session_id=state["session_id"],
            source_images=source_images,
            prompts=prompts,
            tabs=tabs,
        )

        state["generated_images"] = generated
        plan = state.get("intervention_plan") or {}
        level = state.get("selected_level") or "low"
        selected = plan.get(level) or plan.get("low") or plan.get("free")
        if isinstance(selected, dict):
            existing = selected.get("generatedImages") if isinstance(selected.get("generatedImages"), dict) else {}
            selected["generatedImages"] = {**existing, **generated}
            if generated.get("render1"):
                selected["afterImage"] = generated["render1"]
            plan[level] = selected
            state["intervention_plan"] = plan

        state["stage"] = "images_generated"
        state["error"] = None
    except Exception as e:
        state["generated_images"] = {}
        state["stage"] = "image_generation_failed"
        state["error"] = f"Image generation failed: {e}"

    return state


def write_letter_node(state: NestAIState) -> NestAIState:
    """Generate the reflective letter after user feedback."""
    try:
        prompt = create_p003_prompt()
        model = llm_manager.get_model()
        intervention = state.get("intervention_plan") or {}
        selected_level = state.get("selected_level") or "low"
        selected_plan = intervention.get(selected_level) or intervention.get("low") or {}

        conversation_summary = (
            f"空间观察: {(state.get('space_summary') or '')[:500]}\n"
            f"方案层级: {selected_level}\n"
        )

        messages = prompt.format_messages(
            history=[],
            user_id=state.get("user_id", "朋友"),
            intervention_level=selected_level,
            intervention_plan=json.dumps(selected_plan, ensure_ascii=False, indent=2),
            completion_status=state.get("completion_status", "完成了一部分"),
            user_feeling=state.get("user_feeling", ""),
            conversation_summary=(
                conversation_summary
                + f"长期记忆摘要: {(state.get('long_term_context') or '')[:700]}\n"
            ),
        )

        response = model.invoke(messages)
        state["farewell_letter"] = str(response.content)
        state["stage"] = "letter_written"
        state["error"] = None
    except Exception as e:
        state["farewell_letter"] = fallback_letter(state)
        state["stage"] = "letter_written"
        state["error"] = f"P003 fallback used: {e}"

    return state


def update_memory_summary_node(state: NestAIState) -> NestAIState:
    """Prepare a compact memory summary for persistence by the service layer."""
    plan = state.get("intervention_plan") or {}
    level = state.get("selected_level") or "low"
    selected: Dict[str, Any] = plan.get(level) or plan.get("low") or {}
    state["memory_update"] = {
        "selected_level": level,
        "plan_title": selected.get("title", ""),
        "first_step": (selected.get("firstSteps") or [""])[0],
        "user_feeling": state.get("user_feeling", ""),
    }
    state["stage"] = "memory_update_ready"
    return state
