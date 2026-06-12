from typing import Any, Dict, List, Optional, TypedDict


class NestAIState(TypedDict, total=False):
    """Shared state passed between NestAI workflow nodes.

    The full product flow has user-pause boundaries, so API endpoints run
    stage graphs with the same state shape instead of forcing one long request.
    """

    session_id: str
    user_id: str
    stage: str

    # Persisted context.
    space_summary: str
    long_term_context: str
    questions: List[Dict[str, Any]]
    intervention_plan: Dict[str, Any]

    # Questionnaire input.
    aspiration: List[str]
    current_state: List[str]
    constraints: Dict[str, str]

    # Image generation preparation.
    selected_level: str
    source_images: List[str]
    image_tabs: List[str]
    image_prompts: Dict[str, str]
    generated_images: Dict[str, str]

    # Feedback and letter input.
    completion_status: str
    user_feeling: str
    farewell_letter: str
    memory_update: Dict[str, Any]

    # Diagnostics.
    error: Optional[str]
