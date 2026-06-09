"""NestAI Backend - FastAPI application."""

import datetime
import mimetypes
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from app.api import memory_router, sessions_router, spaces_router, upload_router, users_router
from app.core.config import get_settings, get_default_llm_config, load_llm_configs
from app.services.memory_service import init_db
from app.services.storage_service import get_storage_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] NestAI Backend Starting...")
    init_db()
    print("[OK] Database initialized")

    settings = get_settings()
    print(f"[OK] Environment: {settings.app_env}")
    print(f"[OK] Database URL: {settings.database_url}")
    print(f"[OK] Storage backend: {'supabase' if get_storage_service().use_supabase else 'local'}")

    yield

    print("[STOP] NestAI Backend Shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="NestAI API",
        description="NestAI smart space intervention API",
        version="1.0.0",
        lifespan=lifespan,
    )

    settings = get_settings()
    origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()] or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(sessions_router)
    app.include_router(upload_router)
    app.include_router(spaces_router)
    app.include_router(memory_router)
    app.include_router(users_router)

    os.makedirs(settings.upload_dir, exist_ok=True)
    storage = get_storage_service()
    if storage.use_supabase:
        @app.get("/uploads/{object_path:path}")
        async def uploaded_file(object_path: str):
            content, media_type = storage.read_bytes(f"/uploads/{object_path}")
            media_type = media_type or mimetypes.guess_type(object_path)[0] or "application/octet-stream"
            return Response(content=content, media_type=media_type)
    else:
        app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    @app.get("/")
    async def root():
        return {
            "name": "NestAI API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs",
        }

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}

    @app.get("/test-config")
    async def test_config():
        default = get_default_llm_config()
        return {
            "cwd": os.getcwd(),
            "openai_key_exists": "OPENAI_API_KEY" in os.environ,
            "configs_loaded": list(load_llm_configs().keys()),
            "default_config": (
                {
                    "name": default.name,
                    "api_key_preview": default.api_key[:10] + "..." if default.api_key else "EMPTY",
                    "type": default.type,
                }
                if default
                else None
            ),
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
        log_level="info",
    )
