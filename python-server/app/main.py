"""
NestAI Backend - FastAPI Application
基于LangChain + LangGraph的智能空间干预系统
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.api import sessions_router, upload_router, spaces_router, memory_router
from app.core.config import get_settings
from app.services.memory_service import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    print("[START] NestAI Backend Starting...")

    # 初始化数据库
    init_db()
    print("[OK] Database initialized")

    # 加载环境变量
    settings = get_settings()
    print(f"[OK] Environment: {settings.app_env}")
    print(f"[OK] Database URL: {settings.database_url}")

    yield

    # 关闭时清理
    print("[STOP] NestAI Backend Shutting down...")


def create_app() -> FastAPI:
    """创建FastAPI应用实例"""

    app = FastAPI(
        title="NestAI API",
        description="智能空间干预系统后端 API",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 生产环境应该限制具体域名
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 注册路由
    app.include_router(sessions_router)
    app.include_router(upload_router)
    app.include_router(spaces_router)
    app.include_router(memory_router)

    # 静态文件服务（上传的图片等）
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    # 根路由
    @app.get("/")
    async def root():
        return {
            "name": "NestAI API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs"
        }

    # 健康检查
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": __import__('datetime').datetime.utcnow().isoformat()
        }

    # TEMPORARY TEST ENDPOINT
    @app.get("/test-config")
    async def test_config():
        import os
        from app.core.config import load_llm_configs, get_default_llm_config

        result = {
            "cwd": os.getcwd(),
            "openai_key_exists": "OPENAI_API_KEY" in os.environ,
            "configs_loaded": list(load_llm_configs().keys()),
            "default_config": None
        }

        default = get_default_llm_config()
        if default:
            result["default_config"] = {
                "name": default.name,
                "api_key_preview": default.api_key[:10] + "..." if default.api_key else "EMPTY",
                "type": default.type
            }

        return result

    return app


# 创建应用实例
app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()

    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
        log_level="info"
    )
