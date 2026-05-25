"""Run Prompt5 + Pic2 through OpenAI GPT Image 1.5.

This script reads:
- prompts/P005_bauhaus_image_edit.md
- tests/assets/images/Pic2.jpg (also accepts pic02/Pic02 naming)

Then it calls OpenAI Images Edit with gpt-image-1.5 and saves the output under:
- tests/output/image_generation/prompt5_image15_YYYYMMDD_HHMMSS.png

Usage:
    python tests/api/test_generation.py
    python tests/api/test_generation.py --dry-run
    python tests/api/test_generation.py --model gpt-image-1.5 --size 1024x1024
"""

from __future__ import annotations

import argparse
import base64
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageOps


PROJECT_DIR = Path(__file__).resolve().parents[2]
TESTS_DIR = PROJECT_DIR / "tests"
PIC_DIR = TESTS_DIR / "assets" / "images"
PROMPT_PATH = PROJECT_DIR / "prompts" / "P005_bauhaus_image_edit.md"
OUTPUT_DIR = TESTS_DIR / "output" / "image_generation"

PIC_CANDIDATES = (
    "pic02.jpg",
    "pic02.jpeg",
    "pic02.png",
    "pic02.webp",
    "Pic02.jpg",
    "Pic02.jpeg",
    "Pic02.png",
    "Pic02.webp",
    "Pic2.jpg",
    "Pic2.jpeg",
    "Pic2.png",
    "Pic2.webp",
)


def load_env() -> None:
    """Load env files without printing secrets."""
    for env_path in (
        PROJECT_DIR / "backend" / ".env",
        PROJECT_DIR / ".env",
    ):
        if env_path.exists():
            load_dotenv(env_path, override=False)


def find_pic02() -> Path:
    for name in PIC_CANDIDATES:
        path = PIC_DIR / name
        if path.exists():
            return path
    raise FileNotFoundError(
        "Could not find pic02. Put one of these files under tests/assets/images: "
        + ", ".join(PIC_CANDIDATES)
    )


def load_prompt5() -> str:
    if not PROMPT_PATH.exists():
        raise FileNotFoundError("P005_bauhaus_image_edit.md not found under prompts/.")

    prompt = PROMPT_PATH.read_text(encoding="utf-8").strip()
    if not prompt:
        raise ValueError("P005_bauhaus_image_edit.md is empty.")
    return prompt


def save_image(image_b64: str, output_format: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    extension = output_format.lower()
    if extension == "jpeg":
        extension = "jpg"

    output_path = OUTPUT_DIR / f"prompt5_image15_{timestamp}.{extension}"
    output_path.write_bytes(base64.b64decode(image_b64))
    return output_path


def prepare_image_for_openai(image_path: Path, max_input_side: int) -> Path:
    """Normalize MPO/EXIF/ICC-heavy phone images into a clean RGB PNG."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(image_path) as source:
        image = ImageOps.exif_transpose(source)
        image.load()

    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGB")
    elif image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.getchannel("A"))
        image = background
    else:
        image = image.convert("RGB")

    if max_input_side > 0:
        image.thumbnail((max_input_side, max_input_side), Image.Resampling.LANCZOS)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    normalized_path = OUTPUT_DIR / f"prompt5_input_normalized_{timestamp}.png"
    image.save(normalized_path, format="PNG", optimize=True)
    return normalized_path


def call_image_edit(
    *,
    image_path: Path,
    prompt: str,
    model: str,
    size: str,
    quality: str,
    output_format: str,
) -> Path:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set. Add it to backend/.env or .env.")

    client = OpenAI(api_key=api_key, timeout=180.0, max_retries=2)

    with image_path.open("rb") as image_file:
        response = client.images.edit(
            model=model,
            image=image_file,
            prompt=prompt,
            n=1,
            size=size,
            quality=quality,
            output_format=output_format,
            input_fidelity="high",
        )

    if not response.data or not response.data[0].b64_json:
        raise ValueError("OpenAI returned no image data.")

    return save_image(response.data[0].b64_json, output_format)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Test Prompt5 + Pic2 with OpenAI gpt-image-1.5.")
    parser.add_argument("--model", default="gpt-image-1.5", help="OpenAI image model.")
    parser.add_argument("--size", default="1024x1024", help="Output size, for example 1024x1024.")
    parser.add_argument("--quality", default="auto", help="Image quality, for example auto/high/medium/low.")
    parser.add_argument("--output-format", default="png", choices=["png", "jpeg", "webp"], help="Output file format.")
    parser.add_argument("--max-input-side", type=int, default=2048, help="Resize input image longest side before upload. Use 0 to keep original size.")
    parser.add_argument("--no-normalize", action="store_true", help="Send the source image directly without RGB PNG normalization.")
    parser.add_argument("--dry-run", action="store_true", help="Validate files/env without calling OpenAI.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env()

    image_path = find_pic02()
    prompt = load_prompt5()
    upload_image_path = image_path if args.no_normalize else prepare_image_for_openai(image_path, args.max_input_side)

    print("[OK] image:", image_path)
    if upload_image_path != image_path:
        print("[OK] normalized image:", upload_image_path)
    print("[OK] prompt:", PROMPT_PATH)
    print("[OK] prompt chars:", len(prompt))
    print("[OK] model:", args.model)
    print("[OK] size:", args.size)
    print("[OK] output_format:", args.output_format)

    if args.dry_run:
        print("[DRY RUN] OpenAI call skipped.")
        return

    output_path = call_image_edit(
        image_path=upload_image_path,
        prompt=prompt,
        model=args.model,
        size=args.size,
        quality=args.quality,
        output_format=args.output_format,
    )
    print("[OK] generated image:", output_path)


if __name__ == "__main__":
    main()

