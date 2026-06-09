"""Budget tier helpers shared by NestAI backend workflows and APIs."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Optional


BUDGET_LEVELS = ("low_budget", "standard_budget", "sufficient_budget")
DEFAULT_LEVEL = "standard_budget"

LEVEL_LABELS = {
    "low_budget": "低预算",
    "standard_budget": "标准预算",
    "sufficient_budget": "预算充足",
}

LEGACY_TO_LEVEL = {
    "free": "low_budget",
    "low": "standard_budget",
    "advanced": "sufficient_budget",
}

LEVEL_ALIASES = {
    **{level: level for level in BUDGET_LEVELS},
    **LEGACY_TO_LEVEL,
}

LEGACY_KEYS_BY_LEVEL = {
    "low_budget": ("free",),
    "standard_budget": ("low",),
    "sufficient_budget": ("advanced",),
}


def normalize_level(level: Optional[str], default: str = DEFAULT_LEVEL) -> str:
    """Return the canonical budget tier key, accepting legacy tier keys."""
    if not level:
        return default
    return LEVEL_ALIASES.get(str(level), default)


def level_label(level: Optional[str]) -> str:
    return LEVEL_LABELS.get(normalize_level(level), LEVEL_LABELS[DEFAULT_LEVEL])


def level_lookup_keys(level: Optional[str]) -> Iterable[str]:
    """Yield canonical and legacy keys in the order we should read them."""
    canonical = normalize_level(level)
    seen = set()
    for key in (
        canonical,
        str(level or ""),
        *LEGACY_KEYS_BY_LEVEL.get(canonical, ()),
        DEFAULT_LEVEL,
        *LEGACY_KEYS_BY_LEVEL.get(DEFAULT_LEVEL, ()),
        *BUDGET_LEVELS,
        "low",
        "free",
        "advanced",
    ):
        if key and key not in seen:
            seen.add(key)
            yield key


def get_plan_for_level(
    plan: Optional[Dict[str, Any]],
    level: Optional[str],
    default: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Read a plan tier from canonical or legacy keys."""
    if not isinstance(plan, dict):
        return default

    for key in level_lookup_keys(level):
        value = plan.get(key)
        if isinstance(value, dict):
            return value
    return default
