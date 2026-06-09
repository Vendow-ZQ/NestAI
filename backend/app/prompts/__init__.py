"""Prompt builders for the NestAI workflow."""

from pathlib import Path

from langchain_core.prompts import ChatPromptTemplate


def load_prompt_file(file_name: str, fallback: str) -> str:
    """Load an editable production prompt, with a code fallback."""
    project_root = Path(__file__).resolve().parents[3]
    prompt_path = project_root / "prompts" / file_name
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return fallback


def escape_template_braces(text: str) -> str:
    """Keep JSON examples in system prompts from becoming LangChain variables."""
    return text.replace("{", "{{").replace("}", "}}")


def create_p001_prompt():
    system_prompt = load_prompt_file(
        "P001_space_analysis.md",
        "你是 NestAI 的空间观察员。请根据用户空间图片，输出具体、温柔、只基于可见事实的空间观察，并生成 3 道动态问卷。",
    )
    return ChatPromptTemplate.from_messages(
        [
            ("system", escape_template_braces(system_prompt)),
            (
                "human",
                """空间描述：
{image_description}

请严格按照 Prompt1 要求的 MEMORY01、QA、JSON 结构输出。""",
            ),
        ]
    )


def create_p002_prompt():
    system_prompt = load_prompt_file(
        "P002_intervention_plan.md",
        """你是 NestAI 的空间干预方案生成器。你的任务不是装修或导购，而是把用户想靠近的生活状态翻译成可执行的空间改变。

只输出 JSON，不要 Markdown。JSON 必须包含 core_intent、low_budget、standard_budget、sufficient_budget 四个键。每个预算档位的值都必须包含：
title: string
changes: string[]
diagnosis: string
firstSteps: string[]
recommendations: (string | {"name": string, "price": string})[]
estimatedTime: string
costRange: string

语气温柔、具体、可行动。三档含义：
low_budget = 低预算；standard_budget = 标准预算；sufficient_budget = 预算充足。

方案必须同时参考：
1. 图片理解得到的空间观察 Memory01；
2. 用户在问卷中选择/输入的生活状态、当前问题和限制条件；
3. 压缩后的长期记忆摘要。""",
    )
    return ChatPromptTemplate.from_messages(
        [
            ("system", escape_template_braces(system_prompt)),
            (
                "human",
                """长期记忆摘要（压缩版，可能为空）：
{long_term_context}

空间观察：
{space_summary}

用户想靠近的生活：
{aspiration}

当前经常发生的状态：
{current_state}

约束：
- 使用方式：{sharing}
- 预算：{budget}
- 墙面/打孔：{wall_modification}

请生成三档空间干预方案。""",
            ),
        ]
    )


def create_p004_prompt():
    system_prompt = load_prompt_file(
        "P004_reflection_letter.md",
        "你是 NestAI 的 Nobi。写一封温柔、具体、不评判的中文信，回应用户完成或尝试完成空间改变后的感受。",
    )
    return ChatPromptTemplate.from_messages(
        [
            ("system", escape_template_braces(system_prompt)),
            (
                "human",
                """用户：{user_id}
选择的方案层级：{intervention_level}
方案内容：
{intervention_plan}

完成情况：{completion_status}
用户感受：{user_feeling}

这次对话摘要：
{conversation_summary}

请写一封 4-7 段的中文信，回应用户做出的空间改变，并自然引出下一步可以尝试的小行动。""",
            ),
        ]
    )
