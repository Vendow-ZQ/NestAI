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

            # 加载人格化深度分析Prompt
            prompt_path = Path(__file__).parent.parent.parent / "api_test" / "Prompt1.md"
            if prompt_path.exists():
                with open(prompt_path, "r", encoding="utf-8") as f:
                    system_prompt = f.read()
            else:
                #  fallback to embedded prompt
                system_prompt = self._get_default_personality_prompt()

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

            # 解析输出（新格式：MEMORY01 + QA）
            memory_match = re.search(r'---MEMORY01_START---(.*?)---MEMORY01_END---', content, re.DOTALL)
            qa_match = re.search(r'---QA_START---(.*?)---QA_END---', content, re.DOTALL)

            if memory_match and qa_match:
                memory_content = memory_match.group(1).strip()
                qa_content = qa_match.group(1).strip()

                # 使用QAConverter转换QA为前端格式
                try:
                    from app.utils.qa_converter import QAConverter
                    converter = QAConverter()
                    parsed_questions = converter.parse_qa_markdown(qa_content)
                    frontend_questions = converter.to_frontend_format(parsed_questions)

                    # 提取人格洞察（从Memory01中）
                    personality_insights = extract_personality_insights(memory_content)
                except Exception as e:
                    print(f"QA conversion error: {e}")
                    frontend_questions = self._get_default_questions()
                    personality_insights = {}
            else:
                # 如果解析失败，使用默认问题
                memory_content = content[:1000] if len(content) > 1000 else content
                frontend_questions = self._get_default_questions()
                personality_insights = {}
                qa_content = ""

            return {
                "space_summary": memory_content,  # 完整的人格洞察档案
                "personality_insights": personality_insights,  # 结构化人格数据
                "questions": frontend_questions,  # 前端格式的问题
                "qa_markdown": qa_content,  # 完整QA markdown供后端使用
                "error": None
            }

        except Exception as e:
            print(f"Vision analysis error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "space_summary": "我看到你的空间了。这是一个有待探索的生活场所，让我们进一步了解你对它的期待。",
                "personality_insights": {},
                "questions": self._get_default_questions(),
                "qa_markdown": "",
                "error": str(e)
            }

    def _get_default_personality_prompt(self) -> str:
        """默认人格化分析Prompt（当文件不存在时使用）"""
        return """你是一位空间心理学家。分析空间图片，输出人格与空间洞察档案和验证问卷。

输出格式：
---MEMORY01_START---
# 人格与空间洞察档案
[深度分析]
---MEMORY01_END---

---QA_START---
# 深度验证问卷
[3个精准问题]
---QA_END---"""

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


def extract_personality_insights(memory_content: str):
    """从Memory01中提取结构化人格洞察"""
    import re
    insights = {
        "raw_markdown": memory_content,
        "dominant_personality": "",
        "lifestyle_prototype": "",
        "unmet_needs": [],
        "key_contradictions": [],
        "aesthetic_direction": ""
    }

    try:
        # 提取主导人格特质
        personality_match = re.search(r"### 主导人格特质\s*\n(.+?)\n", memory_content)
        if personality_match:
            insights["dominant_personality"] = personality_match.group(1).strip()

        # 提取生活方式原型
        prototype_match = re.search(r"### 生活方式原型\s*\n(.+?)\n", memory_content)
        if prototype_match:
            insights["lifestyle_prototype"] = prototype_match.group(1).strip()

        # 提取未满足的心理需求
        needs_section = re.search(r"### 未满足的心理需求.*?\n([\s\S]*?)(?=###|##|$)", memory_content)
        if needs_section:
            needs_text = needs_section.group(1)
            needs = re.findall(r"\d+\.\s*(.+?)\n", needs_text)
            insights["unmet_needs"] = [n.strip() for n in needs if n.strip()]

        # 提取关键矛盾点
        contradictions_section = re.search(r"### 关键矛盾点.*?\n([\s\S]*?)(?=###|##|$)", memory_content)
        if contradictions_section:
            contradictions_text = contradictions_section.group(1)
            contradictions = re.findall(r"\d+\.\s*(.+?)\n", contradictions_text)
            insights["key_contradictions"] = [c.strip() for c in contradictions if c.strip()]

        # 提取审美方向
        aesthetic_match = re.search(r"### 审美心理.*?\n([\s\S]*?)(?=###|##|$)", memory_content)
        if aesthetic_match:
            aesthetic_text = aesthetic_match.group(1)
            color_match = re.search(r"色彩[:\s]+(.+?)\n", aesthetic_text)
            if color_match:
                insights["aesthetic_direction"] += "色彩: " + color_match.group(1).strip() + "; "
    except Exception as e:
        print(f"Extract personality insights error: {e}")

    return insights
