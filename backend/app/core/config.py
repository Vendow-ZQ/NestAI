"""配置管理 - 参考 tests/api/test_llm_config.py 的 load_configs 实现"""

import os
import sys
from typing import Dict, List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
from pathlib import Path

# 使用绝对路径加载.env文件（确保无论从哪里启动都能找到）
BASE_DIR = Path(__file__).parent.parent.parent  # backend directory
ENV_PATH = BASE_DIR / ".env"

print(f"[Config] Looking for .env at: {ENV_PATH}")
print(f"[Config] BASE_DIR exists: {BASE_DIR.exists()}, is_dir: {BASE_DIR.is_dir()}")
print(f"[Config] Current working directory: {os.getcwd()}")

import sys

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    sys.stderr.write(f"[Config] Loaded .env from: {ENV_PATH}\n")
    sys.stderr.flush()
    # Debug: print first few chars of API key to verify it's loaded
    test_key = os.getenv("OPENAI_API_KEY", "NOT_FOUND")
    if test_key != "NOT_FOUND":
        sys.stderr.write(f"[Config] OPENAI_API_KEY found: {test_key[:10]}...\n")
    else:
        sys.stderr.write(f"[Config] OPENAI_API_KEY not found in .env\n")
    sys.stderr.flush()
else:
    load_dotenv()  # 尝试默认位置
    sys.stderr.write(f"[Config] Warning: .env not found at {ENV_PATH}, trying default location\n")
    sys.stderr.write(f"[Config] Files in BASE_DIR: {list(BASE_DIR.glob('*.env'))}\n")
    sys.stderr.flush()


class LLMConfig(BaseSettings):
    """单个LLM配置"""
    name: str
    api_key: str
    base_url: Optional[str] = None
    type: str = "openai"  # 'anthropic' 或 'openai'
    models: List[str] = []

    class Config:
        env_file = ".env"
        extra = "ignore"


class Settings(BaseSettings):
    """应用配置"""
    app_env: str = "development"
    app_port: int = 8000
    app_host: str = "0.0.0.0"
    database_url: str = "sqlite:///./nestai.db"
    upload_dir: str = "uploads"
    max_upload_size: int = 52428850  # 50MB
    public_base_url: str = ""
    storage_backend: str = "auto"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "nestai-uploads"
    cors_origins: str = "*"
    image_provider: str = "OPENAI"
    image_model: str = "gpt-image-1.5"
    image_output_format: str = "png"
    image_size: str = "1536x1024"
    image_quality: str = "medium"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """获取应用配置（缓存）"""
    return Settings()


def load_llm_configs() -> Dict[str, LLMConfig]:
    """
    从环境变量加载LLM配置
    参考 tests/api/test_llm_config.py 的 load_configs 函数实现

    格式:
        XXX_API_KEY=...
        XXX_BASE_URL=...
        XXX_MODELS=model1,model2
        XXX_TYPE=anthropic|openai
    """
    configs = {}

    for key in os.environ:
        if key.endswith('_MODELS'):
            prefix = key[:-7]  # 去掉 '_MODELS'
            api_key = os.getenv(f"{prefix}_API_KEY")

            if api_key:
                models_str = os.getenv(key, "")
                models = [m.strip() for m in models_str.split(',') if m.strip()]

                configs[prefix] = LLMConfig(
                    name=prefix.replace('_', ' ').title(),
                    api_key=api_key,
                    base_url=os.getenv(f"{prefix}_BASE_URL"),
                    type=os.getenv(f"{prefix}_TYPE", "openai"),
                    models=models
                )

    return configs


def get_default_llm_config() -> Optional[LLMConfig]:
    """获取默认LLM配置（优先级：ANTHROPIC > OPENAI > 第一个可用的）"""
    configs = load_llm_configs()

    preferred_provider = os.getenv("DEFAULT_LLM_PROVIDER", "").strip().upper()
    if preferred_provider and preferred_provider in configs:
        return configs[preferred_provider]

    if "ANTHROPIC" in configs:
        return configs["ANTHROPIC"]
    elif "OPENAI" in configs:
        return configs["OPENAI"]
    elif configs:
        return next(iter(configs.values()))

    return None
