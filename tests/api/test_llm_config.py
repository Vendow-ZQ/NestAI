"""Check LLM configuration loading without printing secrets."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv


PROJECT_DIR = Path(__file__).resolve().parents[2]
SERVER_DIR = PROJECT_DIR / "python-server"
sys.path.insert(0, str(SERVER_DIR))


def load_env() -> None:
    for env_path in (SERVER_DIR / ".env", PROJECT_DIR / ".env"):
        if env_path.exists():
            load_dotenv(env_path, override=False)


def masked(value: str | None) -> str:
    if not value:
        return "<missing>"
    return value[:6] + "..." + value[-4:] if len(value) > 12 else "<set>"


def main() -> None:
    load_env()

    from app.core.config import load_llm_configs
    from app.core.llm_manager import llm_manager

    configs = load_llm_configs()
    print("[OK] providers:", sorted(configs.keys()))
    print("[OK] default provider:", os.getenv("DEFAULT_LLM_PROVIDER", "OPENAI"))
    print("[OK] default model:", os.getenv("DEFAULT_LLM_MODEL", "gpt-4o"))
    print("[OK] openai key:", masked(os.getenv("OPENAI_API_KEY")))

    model = llm_manager.get_model()
    print("[OK] model class:", model.__class__.__name__)


if __name__ == "__main__":
    main()
