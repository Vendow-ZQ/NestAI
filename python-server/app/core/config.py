"""配置管理 - 参考api_test/test.py的load_configs实现"""

import os
from typing import Dict, List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv

# 加载.env文件到环境变量
load_dotenv()


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
    参考api_test/test.py的load_configs函数实现

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

    if "ANTHROPIC" in configs:
        return configs["ANTHROPIC"]
    elif "OPENAI" in configs:
        return configs["OPENAI"]
    elif configs:
        return next(iter(configs.values()))

    return None
