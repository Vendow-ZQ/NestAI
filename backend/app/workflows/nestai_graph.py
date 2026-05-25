from langgraph.graph import END, StateGraph

from .nodes import (
    build_image_prompt_node,
    generate_images_node,
    plan_intervention_node,
    update_memory_summary_node,
    write_letter_node,
)
from .state import NestAIState


def create_intervention_graph():
    """Graph for the post-questionnaire planning stage."""
    graph = StateGraph(NestAIState)
    graph.add_node("plan_intervention", plan_intervention_node)
    graph.add_node("build_image_prompts", build_image_prompt_node)
    graph.set_entry_point("plan_intervention")
    graph.add_edge("plan_intervention", "build_image_prompts")
    graph.add_edge("build_image_prompts", END)
    return graph.compile()


def create_letter_graph():
    """Graph for the post-feedback reflection stage."""
    graph = StateGraph(NestAIState)
    graph.add_node("write_letter", write_letter_node)
    graph.add_node("update_memory_summary", update_memory_summary_node)
    graph.set_entry_point("write_letter")
    graph.add_edge("write_letter", "update_memory_summary")
    graph.add_edge("update_memory_summary", END)
    return graph.compile()


def create_image_prompt_graph():
    """Graph for regenerating prompts for one selected plan level."""
    graph = StateGraph(NestAIState)
    graph.add_node("build_image_prompts", build_image_prompt_node)
    graph.set_entry_point("build_image_prompts")
    graph.add_edge("build_image_prompts", END)
    return graph.compile()


def create_image_generation_graph():
    """Graph for preparing prompts and generating real preview images."""
    graph = StateGraph(NestAIState)
    graph.add_node("build_image_prompts", build_image_prompt_node)
    graph.add_node("generate_images", generate_images_node)
    graph.set_entry_point("build_image_prompts")
    graph.add_edge("build_image_prompts", "generate_images")
    graph.add_edge("generate_images", END)
    return graph.compile()
