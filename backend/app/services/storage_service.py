"""Storage adapter for local development and Supabase Storage."""

import mimetypes
import posixpath
import re
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

from app.core.config import BASE_DIR, get_settings


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self.upload_root = self._resolve_upload_root()

    def _resolve_upload_root(self) -> Path:
        upload_dir = Path(self.settings.upload_dir)
        return upload_dir if upload_dir.is_absolute() else BASE_DIR / upload_dir

    @property
    def use_supabase(self) -> bool:
        if self.settings.storage_backend.lower() == "local":
            return False
        if self.settings.storage_backend.lower() == "supabase":
            return True
        return bool(
            self.settings.supabase_url
            and self.settings.supabase_service_role_key
            and self.settings.supabase_storage_bucket
        )

    def object_url(self, object_path: str) -> str:
        path = f"/uploads/{self._clean_object_path(object_path)}"
        public_base_url = self.settings.public_base_url.rstrip("/")
        return f"{public_base_url}{path}" if public_base_url else path

    def save_bytes(self, object_path: str, content: bytes, content_type: Optional[str] = None) -> str:
        object_path = self._clean_object_path(object_path)
        if self.use_supabase:
            self._upload_to_supabase(object_path, content, content_type)
            return self.object_url(object_path)

        path = self.upload_root / object_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return self.object_url(object_path)

    def read_bytes(self, image_url: str) -> Tuple[bytes, str]:
        object_path = self.object_path_from_url(image_url)
        if object_path and self.use_supabase:
            content = self._download_from_supabase(object_path)
            mime_type = mimetypes.guess_type(object_path)[0] or "application/octet-stream"
            return content, mime_type

        if object_path:
            path = self.upload_root / object_path
            content = path.read_bytes()
            mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            return content, mime_type

        return self._download_external_url(image_url)

    def materialize(self, image_url: str) -> Path:
        object_path = self.object_path_from_url(image_url)
        if object_path and not self.use_supabase:
            path = self.upload_root / object_path
            if not path.exists():
                raise FileNotFoundError(f"Source image not found: {path}")
            return path

        content, mime_type = self.read_bytes(image_url)
        suffix = Path(object_path or urllib.parse.urlparse(image_url).path).suffix
        if not suffix:
            suffix = mimetypes.guess_extension(mime_type) or ".jpg"

        cache_dir = self.upload_root / ".cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=cache_dir) as tmp:
            tmp.write(content)
            return Path(tmp.name)

    def object_path_from_url(self, image_url: str) -> Optional[str]:
        if not image_url:
            return None
        parsed = urllib.parse.urlparse(image_url)
        path = parsed.path if parsed.scheme else image_url
        if path.startswith("/uploads/"):
            return self._clean_object_path(path[len("/uploads/") :])
        if not parsed.scheme:
            return self._clean_object_path(path)

        public_prefix = f"/storage/v1/object/public/{self.settings.supabase_storage_bucket}/"
        object_prefix = f"/storage/v1/object/{self.settings.supabase_storage_bucket}/"
        if public_prefix in path:
            return self._clean_object_path(path.split(public_prefix, 1)[1])
        if object_prefix in path:
            return self._clean_object_path(path.split(object_prefix, 1)[1])
        return None

    def _clean_object_path(self, object_path: str) -> str:
        normalized = posixpath.normpath(object_path.replace("\\", "/")).lstrip("/")
        if normalized in {"", "."} or normalized.startswith("../"):
            raise ValueError(f"Invalid storage path: {object_path}")
        return normalized

    def _supabase_object_endpoint(self, object_path: str) -> str:
        base = self.settings.supabase_url.rstrip("/")
        bucket = urllib.parse.quote(self.settings.supabase_storage_bucket.strip("/"), safe="")
        encoded_path = "/".join(urllib.parse.quote(part, safe="") for part in object_path.split("/"))
        return f"{base}/storage/v1/object/{bucket}/{encoded_path}"

    def _supabase_headers(self, content_type: Optional[str] = None) -> dict:
        key = self.settings.supabase_service_role_key
        headers = {
            "Authorization": f"Bearer {key}",
            "apikey": key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _upload_to_supabase(self, object_path: str, content: bytes, content_type: Optional[str]) -> None:
        mime_type = content_type or mimetypes.guess_type(object_path)[0] or "application/octet-stream"
        headers = self._supabase_headers(mime_type)
        headers["x-upsert"] = "true"
        request = urllib.request.Request(
            self._supabase_object_endpoint(object_path),
            data=content,
            headers=headers,
            method="POST",
        )
        with self._open_or_raise(request, f"upload {object_path} to Supabase Storage"):
            pass

    def _download_from_supabase(self, object_path: str) -> bytes:
        request = urllib.request.Request(
            self._supabase_object_endpoint(object_path),
            headers=self._supabase_headers(),
            method="GET",
        )
        with self._open_or_raise(request, f"download {object_path} from Supabase Storage") as response:
            return response.read()

    def _download_external_url(self, url: str) -> Tuple[bytes, str]:
        request = urllib.request.Request(url, headers={"User-Agent": "NestAI/1.0"})
        with self._open_or_raise(request, f"download external image {url}") as response:
            mime_type = response.headers.get("Content-Type") or mimetypes.guess_type(url)[0] or "image/jpeg"
            return response.read(), mime_type

    def _open_or_raise(self, request: urllib.request.Request, action: str):
        try:
            return urllib.request.urlopen(request, timeout=60)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Failed to {action}: HTTP {exc.code} {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Failed to {action}: {exc.reason}") from exc


_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service


def safe_file_name(name: str, fallback_ext: str = ".jpg") -> str:
    suffix = Path(name or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        suffix = fallback_ext
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(name or "image").stem).strip("-")
    return f"{stem or 'image'}{suffix}"
