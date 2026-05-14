"""Prompts模块 - P001/P002/P003三个阶段的Prompt模板"""

from .p001_space_analysis import create_p001_prompt, P001_SYSTEM_PROMPT
from .p002_intervention import create_p002_prompt, P002_SYSTEM_PROMPT
from .p003_farewell_letter import create_p003_prompt, P003_SYSTEM_PROMPT

__all__ = [
    'create_p001_prompt',
    'create_p002_prompt',
    'create_p003_prompt',
    'P001_SYSTEM_PROMPT',
    'P002_SYSTEM_PROMPT',
    'P003_SYSTEM_PROMPT',
]