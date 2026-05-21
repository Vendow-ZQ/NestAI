"""OpenAI image generation/editing service for space interventions."""

import base64
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List

from openai import OpenAI
from PIL import Image, ImageOps

from app.core.config import BASE_DIR, get_settings


class ImageGenerationService:
    """Generate intervention preview images and store them in local uploads."""

    def __init__(self):
        self.settings = get_settings()
        self.provider = self.settings.image_provider.upper()
        self.model = self.settings.image_model
        if self.provider != "OPENAI":
            raise ValueError(f"Unsupported image provider: {self.provider}")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required for image generation")
        self.client = OpenAI(api_key=api_key, timeout=120.0, max_retries=2)

    @property
    def upload_root(self) -> Path:
        upload_dir = Path(self.settings.upload_dir)
        return upload_dir if upload_dir.is_absolute() else BASE_DIR / upload_dir

    def resolve_upload_path(self, image_url: str) -> Path:
        if image_url.startswith("/uploads/"):
            relative = image_url[len("/uploads/"):]
        else:
            relative = image_url

        path = self.upload_root / relative
        if not path.exists():
            raise FileNotFoundError(f"Source image not found: {path}")
        return path

    def prepare_image_for_openai(self, image_path: Path) -> Path:
        """Normalize phone/MPO/EXIF-heavy uploads into clean RGB PNG files.

        This mirrors the successful tests/api/test_generation.py path. OpenAI's
        image edit endpoint can reject MPO containers or images with unusual
        metadata even when the file extension is .jpg.
        """
        normalized_dir = self.upload_root / "generated" / "normalized-inputs"
        normalized_dir.mkdir(parents=True, exist_ok=True)

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

        image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)

        output_path = normalized_dir / f"{image_path.stem}-{uuid.uuid4().hex}.png"
        image.save(output_path, format="PNG", optimize=True)
        return output_path

    def save_image(self, image_b64: str, session_id: str, tab: str) -> str:
        today = datetime.utcnow().strftime("%Y%m%d")
        output_dir = self.upload_root / "generated" / today
        output_dir.mkdir(parents=True, exist_ok=True)

        extension = self.settings.image_output_format.lower()
        if extension not in {"png", "jpeg", "webp"}:
            extension = "png"

        file_name = f"{session_id}-{tab}-{uuid.uuid4().hex}.{extension}"
        output_path = output_dir / file_name
        output_path.write_bytes(base64.b64decode(image_b64))
        return f"/uploads/generated/{today}/{file_name}"

    def generate_from_original(
        self,
        *,
        session_id: str,
        source_images: List[str],
        prompts: Dict[str, str],
        tabs: Iterable[str],
    ) -> Dict[str, str]:
        """Generate images for the requested tabs from original uploaded images."""
        if not source_images:
            raise ValueError("No source images available for image generation")

        original_source_paths = [self.resolve_upload_path(url) for url in source_images[:4]]
        source_paths = [self.prepare_image_for_openai(path) for path in original_source_paths]
        generated: Dict[str, str] = {}
        negative = prompts.get("negative", "")

        for tab in tabs:
            prompt = prompts.get(tab)
            if not prompt:
                continue

            full_prompt = prompt
            if negative:
                full_prompt += f"\n\nAvoid: {negative}"

            files = [path.open("rb") for path in source_paths]
            try:
                response = self.client.images.edit(
                    model=self.model,
                    image=files if len(files) > 1 else files[0],
                    prompt=full_prompt,
                    n=1,
                    size=self.settings.image_size,
                    quality=self.settings.image_quality,
                    output_format=self.settings.image_output_format,
                    input_fidelity="high",
                )
            except Exception as exc:
                debug_dir = self.upload_root / "debug"
                debug_dir.mkdir(parents=True, exist_ok=True)
                debug_file = debug_dir / f"{session_id}-{tab}-image-error.txt"
                debug_file.write_text(
                    "\n".join(
                        [
                            f"model={self.model}",
                            f"size={self.settings.image_size}",
                            f"quality={self.settings.image_quality}",
                            f"output_format={self.settings.image_output_format}",
                            f"source_images={[str(path) for path in original_source_paths]}",
                            f"normalized_images={[str(path) for path in source_paths]}",
                            f"error={type(exc).__name__}: {exc}",
                            "",
                            "prompt:",
                            full_prompt,
                        ]
                    ),
                    encoding="utf-8",
                )
                raise
            finally:
                for file in files:
                    file.close()

            if not response.data or not response.data[0].b64_json:
                raise ValueError(f"Image generation returned no image for tab: {tab}")

            generated[tab] = self.save_image(response.data[0].b64_json, session_id, tab)

        return generated


def get_image_generation_service() -> ImageGenerationService:
    return ImageGenerationService()
