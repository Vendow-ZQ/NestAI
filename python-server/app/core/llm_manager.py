"""LLM管理模块 - 参考api_test/test.py实现"""

from typing import Optional, Dict, Any, List
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from .config import LLMConfig, load_llm_configs, get_default_llm_config
import os


class LLMManager:
    """LLM管理器 - 支持多模型切换"""

    def __init__(self):
        self._models: Dict[str, BaseChatModel] = {}
        self._current_config: Optional[LLMConfig] = None

    def create_model(self, config: LLMConfig, model_name: Optional[str] = None) -> BaseChatModel:
        """
        根据配置创建LangChain模型实例
        参考test.py的pick_model函数
        """
        model_name = model_name or config.models[0] if config.models else None
        if not model_name:
            raise ValueError("No model specified")

        kwargs = {
            "api_key": config.api_key,
            "base_url": config.base_url,
            "model": model_name,
            "temperature": 0.7,
            "max_tokens": 4096
        }

        if config.type == "anthropic":
            model = ChatAnthropic(**kwargs)
        else:
            model = ChatOpenAI(**kwargs)

        return model

    def get_model(self, provider: Optional[str] = None, model_name: Optional[str] = None) -> BaseChatModel:
        """
        获取模型实例（带缓存）
        """
        cache_key = f"{provider or 'default'}:{model_name or 'default'}"

        if cache_key not in self._models:
            configs = load_llm_configs()

            if provider and provider in configs:
                config = configs[provider]
            else:
                config = get_default_llm_config()

            if not config:
                raise ValueError("No LLM configuration found. Please set API keys in .env")

            self._current_config = config
            self._models[cache_key] = self.create_model(config, model_name)

        return self._models[cache_key]

    def list_available_models(self) -> Dict[str, List[str]]:
        """列出所有可用的模型"""
        configs = load_llm_configs()
        return {name: config.models for name, config in configs.items()}


# 全局LLM管理器实例
llm_manager = LLMManager()


def get_llm_manager() -> LLMManager:
    """获取LLM管理器实例"""
    return llm_manager
