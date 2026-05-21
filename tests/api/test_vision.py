"""Manual P001 vision test.

Reads prompts/P001_space_analysis.md and tests/assets/images/Pic*.jpg, then
calls OpenAI vision directly. This is a diagnostic script, not a pytest test.
"""

from __future__ import annotations

import argparse
import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


PROJECT_DIR = Path(__file__).resolve().parents[2]
PIC_DIR = PROJECT_DIR / "tests" / "assets" / "images"
PROMPT_PATH = PROJECT_DIR / "prompts" / "P001_space_analysis.md"
OUTPUT_DIR = PROJECT_DIR / "tests" / "output" / "vision"


def load_env() -> None:
    for env_path in (PROJECT_DIR / "python-server" / ".env", PROJECT_DIR / ".env"):
        if env_path.exists():
            load_dotenv(env_path, override=False)


def load_images(limit: int) -> list[dict[str, str]]:
    images = []
    for image_path in sorted(PIC_DIR.glob("Pic*.jpg"))[:limit]:
        image_b64 = base64.b64encode(image_path.read_bytes()).decode("utf-8")
        images.append({"name": image_path.name, "base64": image_b64})
    return images


def call_vision(images: list[dict[str, str]], prompt: str, model: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set. Add it to python-server/.env or .env.")

    content: list[dict] = [
        {
            "type": "text",
            "text": (
                f"Please analyze these {len(images)} photos as one user space. "
                "Return the exact P001 sections required by the system prompt."
            ),
        }
    ]
    for image in images:
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image['base64']}"},
            }
        )

    client = OpenAI(api_key=api_key, timeout=180.0, max_retries=2)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": content},
        ],
        max_tokens=4000,
        temperature=0.4,
    )
    return response.choices[0].message.content or ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a manual P001 vision call.")
    parser.add_argument("--model", default="gpt-4o", help="OpenAI vision-capable model.")
    parser.add_argument("--limit", type=int, default=2, help="Number of Pic*.jpg files to send.")
    parser.add_argument("--dry-run", action="store_true", help="Validate files/env without calling OpenAI.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env()

    if not PROMPT_PATH.exists():
        raise FileNotFoundError(f"Prompt not found: {PROMPT_PATH}")

    images = load_images(args.limit)
    if not images:
        raise FileNotFoundError(f"No Pic*.jpg images found under {PIC_DIR}")

    prompt = PROMPT_PATH.read_text(encoding="utf-8").strip()
    print("[OK] prompt:", PROMPT_PATH)
    print("[OK] prompt chars:", len(prompt))
    print("[OK] images:", [image["name"] for image in images])
    print("[OK] model:", args.model)

    if args.dry_run:
        print("[DRY RUN] OpenAI call skipped.")
        return

    result = call_vision(images, prompt, args.model)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "p001_vision_output.md"
    output_path.write_text(result, encoding="utf-8")
    print("[OK] output:", output_path)


if __name__ == "__main__":
    main()
