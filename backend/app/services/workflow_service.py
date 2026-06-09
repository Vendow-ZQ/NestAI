"""Workflow service for NestAI's user-paused AI stages.

The product flow has natural pauses for questionnaire answers and feedback.
This service keeps the API contract stable while delegating AI work to
LangGraph stage graphs under app.workflows.
"""

import json
from typing import Any, Dict, List, Optional

from app.core.levels import DEFAULT_LEVEL, normalize_level
from app.services.memory_service import MemoryService
from app.workflows.nestai_graph import (
    create_image_generation_graph,
    create_image_prompt_graph,
    create_intervention_graph,
    create_letter_graph,
)
from app.workflows.state import NestAIState


def safe_json_loads(value: Optional[str], default: Any):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


class WorkflowService:
    """Thin coordinator around the NestAI LangGraph stage graphs."""

    def __init__(self, memory_service: MemoryService):
        self.memory_service = memory_service
        self.intervention_graph = create_intervention_graph()
        self.image_prompt_graph = create_image_prompt_graph()
        self.image_generation_graph = create_image_generation_graph()
        self.letter_graph = create_letter_graph()

    def _session_context(self, session_id: str) -> Dict[str, Any]:
        memory = self.memory_service.get_session_memory(session_id)
        if not memory:
            raise ValueError(f"Session not found: {session_id}")

        space_analysis = safe_json_loads(memory.space_analysis, {})
        intervention_plan = safe_json_loads(memory.intervention_plan, {})
        feedback = safe_json_loads(memory.feedback, {})
        long_term_context = self.memory_service.get_compact_long_term_memory(memory.user_id)

        return {
            "memory": memory,
            "space_analysis": space_analysis,
            "intervention_plan": intervention_plan,
            "feedback": feedback,
            "long_term_context": long_term_context,
        }

    async def run_intervention_generation(
        self,
        session_id: str,
        aspiration: List[str],
        current_state: List[str],
        constraints: Dict[str, str],
    ) -> Dict[str, Any]:
        """Run P002 through LangGraph after questionnaire completion."""
        context = self._session_context(session_id)
        run = self.memory_service.start_workflow_run(
            session_id,
            "intervention",
            {
                "aspiration": aspiration,
                "current_state": current_state,
                "constraints": constraints,
            },
        )

        state: NestAIState = {
            "session_id": session_id,
            "user_id": context["memory"].user_id,
            "stage": "intervention_requested",
            "space_summary": context["space_analysis"].get("summary", ""),
            "long_term_context": context["long_term_context"],
            "questions": context["space_analysis"].get("questions", []),
            "aspiration": aspiration,
            "current_state": current_state,
            "constraints": constraints,
            "selected_level": DEFAULT_LEVEL,
        }

        result = self.intervention_graph.invoke(state)
        plan = result.get("intervention_plan") or {}

        if plan:
            self.memory_service.update_session_field(session_id, "chat_responses", {
                "aspiration": aspiration,
                "current_state": current_state,
                "constraints": constraints,
            })
            self.memory_service.update_session_field(session_id, "intervention_plan", plan)
            self.memory_service.update_session_status(session_id, "generated")

        self.memory_service.finish_workflow_run(
            run.id,
            {"intervention_plan": plan, "stage": result.get("stage")},
            result.get("error"),
        )

        return {
            "intervention_plan": plan,
            "error": result.get("error"),
        }

    async def run_image_prompt_generation(self, session_id: str, selected_level: str = DEFAULT_LEVEL) -> Dict[str, Any]:
        """Ensure prompts exist for one intervention level."""
        selected_level = normalize_level(selected_level)
        context = self._session_context(session_id)
        run = self.memory_service.start_workflow_run(
            session_id,
            "image_prompts",
            {"selected_level": selected_level},
        )

        state: NestAIState = {
            "session_id": session_id,
            "user_id": context["memory"].user_id,
            "stage": "image_prompts_requested",
            "space_summary": context["space_analysis"].get("summary", ""),
            "long_term_context": context["long_term_context"],
            "intervention_plan": context["intervention_plan"],
            "selected_level": selected_level,
        }

        result = self.image_prompt_graph.invoke(state)
        plan = result.get("intervention_plan") or context["intervention_plan"]
        prompts = result.get("image_prompts") or {}

        if plan:
            self.memory_service.update_session_field(session_id, "intervention_plan", plan)

        self.memory_service.finish_workflow_run(
            run.id,
            {"image_prompts": prompts, "stage": result.get("stage")},
            result.get("error"),
        )

        return {
            "image_prompts": prompts,
            "intervention_plan": plan,
            "error": result.get("error"),
        }

    async def run_image_generation(
        self,
        session_id: str,
        selected_level: str = DEFAULT_LEVEL,
        tabs: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate real intervention images and persist them into the plan."""
        selected_level = normalize_level(selected_level)
        context = self._session_context(session_id)
        tabs = tabs or ["render1"]
        run = self.memory_service.start_workflow_run(
            session_id,
            "generate_images",
            {"selected_level": selected_level, "tabs": tabs},
        )

        state: NestAIState = {
            "session_id": session_id,
            "user_id": context["memory"].user_id,
            "stage": "image_generation_requested",
            "space_summary": context["space_analysis"].get("summary", ""),
            "long_term_context": context["long_term_context"],
            "source_images": context["space_analysis"].get("images", []),
            "intervention_plan": context["intervention_plan"],
            "selected_level": selected_level,
            "image_tabs": tabs,
        }

        result = self.image_generation_graph.invoke(state)
        plan = result.get("intervention_plan") or context["intervention_plan"]
        generated = result.get("generated_images") or {}
        prompts = result.get("image_prompts") or {}

        if plan:
            self.memory_service.update_session_field(session_id, "intervention_plan", plan)

        self.memory_service.finish_workflow_run(
            run.id,
            {
                "image_prompts": prompts,
                "generated_images": generated,
                "stage": result.get("stage"),
            },
            result.get("error"),
        )

        return {
            "image_prompts": prompts,
            "generated_images": generated,
            "intervention_plan": plan,
            "error": result.get("error"),
        }

    async def run_letter_generation(
        self,
        session_id: str,
        selected_level: str,
        completion_status: str,
        user_feeling: str,
    ) -> Dict[str, Any]:
        """Run P003 through LangGraph after feedback submission."""
        selected_level = normalize_level(selected_level)
        context = self._session_context(session_id)
        run = self.memory_service.start_workflow_run(
            session_id,
            "letter",
            {
                "selected_level": selected_level,
                "completion_status": completion_status,
                "user_feeling": user_feeling,
            },
        )

        state: NestAIState = {
            "session_id": session_id,
            "user_id": context["memory"].user_id,
            "stage": "letter_requested",
            "space_summary": context["space_analysis"].get("summary", ""),
            "long_term_context": context["long_term_context"],
            "intervention_plan": context["intervention_plan"],
            "selected_level": selected_level,
            "completion_status": completion_status,
            "user_feeling": user_feeling,
        }

        result = self.letter_graph.invoke(state)
        letter = result.get("farewell_letter") or ""

        if letter:
            self.memory_service.update_session_field(session_id, "letter_content", letter)
            self.memory_service.update_session_status(session_id, "letter_done")

        memory_update = result.get("memory_update")
        if memory_update:
            self.memory_service.update_long_term_memory(
                context["memory"].user_id,
                intervention_summary=json.dumps(memory_update, ensure_ascii=False),
            )

        self.memory_service.finish_workflow_run(
            run.id,
            {"farewell_letter": letter, "memory_update": memory_update, "stage": result.get("stage")},
            result.get("error"),
        )

        return {
            "farewell_letter": letter,
            "error": result.get("error"),
        }


def get_workflow_service(memory_service: MemoryService) -> WorkflowService:
    return WorkflowService(memory_service)
