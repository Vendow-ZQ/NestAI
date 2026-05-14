"""
视觉分析服务 - 使用多模态LLM分析空间图片
支持 Claude 3 Sonnet 和 GPT-4 Vision
"""

import os
import base64
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from app.core.config import get_settings, load_llm_configs


class VisionService:
    """图像分析服务 - 使用多模态模型理解空间图片"""

    def __init__(self):
        self.settings = get_settings()
        self._model = None

    def get_vision_model(self):
        """获取支持视觉的模型实例"""
        if self._model is None:
            configs = load_llm_configs()

            # 优先使用 Anthropic Claude 3 (支持视觉)
            if "ANTHROPIC" in configs:
                config = configs["ANTHROPIC"]
                # 使用视觉兼容的模型名称
                model_name = "claude-3-sonnet-20240229"  # Claude 3 Sonnet 支持视觉

                self._model = ChatAnthropic(
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=model_name,
                    temperature=0.7,
                    max_tokens=4096
                )
            elif "OPENAI" in configs:
                config = configs["OPENAI"]
                # GPT-4 Vision
                model_name = "gpt-4o"  # GPT-4o 支持视觉

                self._model = ChatOpenAI(
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=model_name,
                    temperature=0.7,
                    max_tokens=4096
                )
            else:
                raise ValueError("No vision-capable LLM configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY")

        return self._model

    def encode_image(self, image_path: str) -> str:
        """将图片编码为base64"""
        # 移除开头的 /uploads/
        if image_path.startswith('/uploads/'):
            relative_path = image_path[9:]  # 移除 '/uploads/'
        else:
            relative_path = image_path

        full_path = Path(self.settings.upload_dir) / relative_path

        if not full_path.exists():
            raise FileNotFoundError(f"Image not found: {full_path}")

        with open(full_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    async def analyze_space_image(
        self,
        image_urls: List[str],
        space_id: str
    ) -> Dict[str, Any]:
        """
        分析空间图片并生成观察报告

        Args:
            image_urls: 图片URL列表
            space_id: 空间ID

        Returns:
            {
                "space_summary": "空间观察摘要Markdown",
                "questions": [{"q": "...", "options": [...]}, ...]
            }
        """
        try:
            model = self.get_vision_model()

            # 准备图片消息
            image_contents = []
            for url in image_urls:
                try:
                    base64_image = self.encode_image(url)
                    image_contents.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    })
                except Exception as e:
                    print(f"Failed to encode image {url}: {e}")
                    continue

            if not image_contents:
                raise ValueError("No valid images to analyze")

            # 系统提示词
            system_prompt = """你是一位空间观察助手，名为"NestAI"。你的任务是通过分析用户居住空间的图片，理解空间特征、功能分布和潜在改善点。

## 观察框架

你需要从以下几个维度分析空间：

1. **空间类型识别**
   - 卧室、客厅、书房、合租单间等
   - 面积估算和布局特点

2. **功能区域划分**
   - 睡眠区、工作区、储物区、休闲区
   - 区域之间的边界清晰度

3. **物品清单**
   - 主要家具（床、桌、椅、柜等）
   - 电子产品（电脑、显示器、灯具等）
   - 装饰品和个人物品

4. **空间使用模式**
   - 当前使用方式暗示
   - 潜在的功能冲突（如床与书桌过近）

5. **可干预点识别**
   - 明显的杂乱区域
   - 未充分利用的角落
   - 光照、通风等环境问题

## 输出要求

你的输出将用于两个用途：

1. **生成空间观察摘要** (Markdown格式)
   - 用温暖、不评判的语气描述你"看到"的
   - 不超过300字
   - 避免使用"问题"、"错误"等负面词汇
   - 使用"注意到"、"感受到"等中性表达

2. **生成3个对话问题** (JSON格式)
   基于空间观察，设计3个选择题帮助用户澄清生活方式：

   问题1: 关于期望 (aspiration)
   - 聚焦：用户希望空间帮他们实现什么生活状态

   问题2: 关于现状 (current_state)
   - 聚焦：当前空间最常发生的真实场景

   问题3: 关于约束条件 (constraints)
   - 聚焦：预算、共享情况、改造权限等实际限制

   每个问题格式：
   {
     "q": "问题文本",
     "options": ["选项1", "选项2", "选项3", ...]
   }

## 输出格式

请严格按以下格式输出：

---MEMORY---
[空间观察摘要Markdown]
---QUESTIONS---
[问题JSON数组]
---END---

注意：
- 对话语气要像一个理解空间的朋友，不是专家在点评
- 避免建议或解决方案，这只是观察阶段
- 问题要具体、有洞察力，避免泛泛而谈
"""

            # 构建消息
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=[
                    {
                        "type": "text",
                        "text": f"请分析我上传的空间图片（空间ID: {space_id}）。这是我居住的空间，请仔细观察并提供温暖的空间观察报告。"
                    },
                    *image_contents
                ])
            ]

            # 调用模型
            response = model.invoke(messages)
            content = response.content

            # 解析输出
            memory_match = re.search(r'---MEMORY---(.*?)---QUESTIONS---', content, re.DOTALL)
            questions_match = re.search(r'---QUESTIONS---(.*?)---END---', content, re.DOTALL)

            if memory_match and questions_match:
                space_summary = memory_match.group(1).strip()
                questions_json = questions_match.group(1).strip()

                # 解析问题JSON
                try:
                    questions = json.loads(questions_json)
                except json.JSONDecodeError:
                    # 尝试从Markdown代码块解析
                    json_match = re.search(r'```json\s*(.*?)\s*```', questions_json, re.DOTALL)
                    if json_match:
                        questions = json.loads(json_match.group(1))
                    else:
                        questions = self._get_default_questions()
            else:
                # 如果解析失败，使用默认问题
                space_summary = content[:500] if len(content) > 500 else content
                questions = self._get_default_questions()

            return {
                "space_summary": space_summary,
                "questions": questions,
                "error": None
            }

        except Exception as e:
            print(f"Vision analysis error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "space_summary": "我看到你的空间了。这是一个有待探索的生活场所，让我们进一步了解你对它的期待。",
                "questions": self._get_default_questions(),
                "error": str(e)
            }

    def _get_default_questions(self) -> List[Dict[str, Any]]:
        """获取默认问题（当图像分析失败时使用）"""
        return [
            {
                "q": "你最希望这个空间帮你做到什么？",
                "options": ["更容易进入专注状态", "回来之后真的能放松下来", "更像'我自己的地方'", "更适合朋友来坐一会儿", "更容易保持整洁和秩序", "更适合睡觉和恢复"]
            },
            {
                "q": "那现在这个空间，最常发生什么？",
                "options": ["我经常在这里学习，但很难进入状态", "我经常在这里刷手机/拖延", "我主要在这里休息，但总觉得不够放松", "我想让它更像'我的'，但不知道从哪开始", "东西越来越多，越来越乱", "我其实很少待在这个房间里"]
            },
            {
                "q": "为了不生成你做不到的方案，我再确认几个小条件。",
                "options": ["一个人使用", "和室友共用", "0元", "100元以内", "300元以内", "300元以上", "可以打孔", "只能无痕", "都不太方便"]
            }
        ]


# 全局视觉服务实例
_vision_service: Optional[VisionService] = None


def get_vision_service() -> VisionService:
    """获取视觉服务实例"""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
    return _vision_service
