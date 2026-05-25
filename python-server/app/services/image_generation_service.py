"""OpenAI image generation/editing service for space interventions."""

import base64
import os
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, Iterable, List

from openai import OpenAI
from PIL import Image, ImageOps

from app.core.config import BASE_DIR, get_settings
from app.services.storage_service import get_storage_service


class ImageGenerationService:
    """Generate intervention preview images and store them through configured storage."""

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
        self.storage = get_storage_service()

    @property
    def upload_root(self) -> Path:
        upload_dir = Path(self.settings.upload_dir)
        return upload_dir if upload_dir.is_absolute() else BASE_DIR / upload_dir

    def resolve_upload_path(self, image_url: str) -> Path:
        return self.storage.materialize(image_url)

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

    def choose_output_size(self, image_path: Path) -> str:
        """Choose the closest supported image output aspect from the source image."""
        configured = (self.settings.image_size or "").strip().lower()
        if configured and configured != "auto":
            # Legacy configs used to force landscape output. Treat that as a
            # default only when the source is landscape, not as an absolute lock.
            if configured not in {"1536x1024", "1024x1536", "1024x1024"}:
                return configured

        with Image.open(image_path) as source:
            image = ImageOps.exif_transpose(source)
            width, height = image.size

        if width <= 0 or height <= 0:
            return "1024x1024"

        ratio = width / height
        if 0.92 <= ratio <= 1.08:
            return "1024x1024"
        if ratio > 1:
            return "1536x1024"
        return "1024x1536"

    def crop_to_aspect(self, image: Image.Image, target_aspect: float) -> Image.Image:
        if target_aspect <= 0:
            return image

        width, height = image.size
        current_aspect = width / height
        if abs(current_aspect - target_aspect) < 0.01:
            return image

        if current_aspect > target_aspect:
            new_width = max(1, int(height * target_aspect))
            left = max(0, (width - new_width) // 2)
            return image.crop((left, 0, left + new_width, height))

        new_height = max(1, int(width / target_aspect))
        top = max(0, (height - new_height) // 2)
        return image.crop((0, top, width, top + new_height))

    def get_image_aspect(self, image_path: Path) -> float:
        with Image.open(image_path) as source:
            image = ImageOps.exif_transpose(source)
            width, height = image.size
        return width / height if width > 0 and height > 0 else 1.0

    def save_image(self, image_b64: str, session_id: str, tab: str, target_aspect: float) -> str:
        today = datetime.utcnow().strftime("%Y%m%d")
        extension = self.settings.image_output_format.lower()
        if extension not in {"png", "jpeg", "webp"}:
            extension = "png"

        file_name = f"{session_id}-{tab}-{uuid.uuid4().hex}.{extension}"
        object_path = f"generated/{today}/{file_name}"

        raw = base64.b64decode(image_b64)
        with Image.open(BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source)
            image.load()
        image = self.crop_to_aspect(image, target_aspect)
        output = BytesIO()
        image.save(output, format=extension.upper() if extension != "jpg" else "JPEG", optimize=True)
        content_type = "image/jpeg" if extension == "jpeg" else f"image/{extension}"
        return self.storage.save_bytes(object_path, output.getvalue(), content_type)

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
        output_size = self.choose_output_size(original_source_paths[0])
        target_aspect = self.get_image_aspect(original_source_paths[0])
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
                    size=output_size,
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
                            f"size={output_size}",
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

            generated[tab] = self.save_image(response.data[0].b64_json, session_id, tab, target_aspect)

        return generated


def get_image_generation_service() -> ImageGenerationService:
    return ImageGenerationService()
