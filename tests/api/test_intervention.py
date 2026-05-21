"""Manual P002 intervention-plan test.

This script sends a small fixture-style input to OpenAI with
prompts/P002_intervention_plan.md. It is useful when tuning P002 outside the
full frontend flow.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


PROJECT_DIR = Path(__file__).resolve().parents[2]
PROMPT_PATH = PROJECT_DIR / "prompts" / "P002_intervention_plan.md"
FIXTURE_PATH = PROJECT_DIR / "tests" / "fixtures" / "qa_answers_example.md"
OUTPUT_DIR = PROJECT_DIR / "tests" / "output" / "intervention"


SAMPLE_MEMORY01 = """
我看见一个物品较满但很有个人痕迹的桌面空间：有学习/工作用品、装饰小物、暖色细节和偏木色的家具。空间已经有温度，但桌面中央的可用空白和收纳边界还不够清晰。
""".strip()


def load_env() -> None:
    for env_path in (PROJECT_DIR / "python-server" / ".env", PROJECT_DIR / ".env"):
        if env_path.exists():
            load_dotenv(env_path, override=False)


def load_fixture() -> str:
    if FIXTURE_PATH.exists():
        return FIXTURE_PATH.read_text(encoding="utf-8").strip()
    return """
aspiration: 更容易进入专注，也保留温馨感。
current_state: 桌面物品容易越堆越多。
constraints: 低预算、不要打孔、希望当天能开始。
""".strip()


def call_intervention(prompt: str, fixture: str, model: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set. Add it to python-server/.env or .env.")

    client = OpenAI(api_key=api_key, timeout=180.0, max_retries=2)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": (
                    "请基于下面输入生成 free/low/advanced 三档 JSON 方案。\n\n"
                    f"Memory01:\n{SAMPLE_MEMORY01}\n\n"
                    f"Questionnaire answers:\n{fixture}\n"
                ),
            },
        ],
        max_tokens=3000,
        temperature=0.5,
    )
    return response.choices[0].message.content or ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a manual P002 intervention call.")
    parser.add_argument("--model", default="gpt-4o", help="OpenAI text model.")
    parser.add_argument("--dry-run", action="store_true", help="Validate files/env without calling OpenAI.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env()

    if not PROMPT_PATH.exists():
        raise FileNotFoundError(f"Prompt not found: {PROMPT_PATH}")

    prompt = PROMPT_PATH.read_text(encoding="utf-8").strip()
    fixture = load_fixture()
    print("[OK] prompt:", PROMPT_PATH)
    print("[OK] prompt chars:", len(prompt))
    print("[OK] fixture chars:", len(fixture))
    print("[OK] model:", args.model)

    if args.dry_run:
        print("[DRY RUN] OpenAI call skipped.")
        return

    result = call_intervention(prompt, fixture, args.model)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "p002_intervention_output.json"
    output_path.write_text(result, encoding="utf-8")
    print("[OK] output:", output_path)


if __name__ == "__main__":
    main()
