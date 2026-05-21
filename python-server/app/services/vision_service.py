"""Vision analysis service for P001.

The service turns uploaded space photos into:
- an internal Memory01 observation
- a short dynamic questionnaire for the frontend
- lightweight structured insight data for later workflow steps
"""

import base64
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings, load_llm_configs
from app.core.llm_manager import llm_manager


class VisionService:
    """Analyze uploaded room/desk images with the configured multimodal model."""

    def __init__(self):
        self.settings = get_settings()
        self._model = None

    def get_vision_model(self):
        """Get the configured multimodal model through the shared LLM manager."""
        if self._model is None:
            configs = load_llm_configs()
            provider = os.getenv("VISION_LLM_PROVIDER", os.getenv("DEFAULT_LLM_PROVIDER", "OPENAI")).strip().upper()
            model_name = os.getenv("VISION_LLM_MODEL", os.getenv("DEFAULT_LLM_MODEL", "gpt-4o")).strip()

            debug_log = Path(self.settings.upload_dir).parent / "debug_vision.log"
            with open(debug_log, "a", encoding="utf-8") as f:
                f.write(f"[VisionService] Loaded configs: {list(configs.keys())}\n")
                f.write(f"[VisionService] Provider: {provider}, model: {model_name}\n")

            if provider not in configs:
                available = ", ".join(configs.keys()) or "none"
                raise ValueError(f"Vision provider {provider} is not configured. Available providers: {available}")

            self._model = llm_manager.get_model(provider=provider, model_name=model_name)

        return self._model

    def encode_image(self, image_path: str) -> str:
        """Encode a locally uploaded image URL/path as base64."""
        relative_path = image_path[9:] if image_path.startswith("/uploads/") else image_path
        full_path = Path(self.settings.upload_dir) / relative_path

        if not full_path.exists():
            raise FileNotFoundError(f"Image not found: {full_path}")

        with open(full_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    async def analyze_space_image(
        self,
        image_urls: List[str],
        space_id: str,
        long_term_context: str = "",
    ) -> Dict[str, Any]:
        """Analyze space images and return Memory01 plus frontend-ready questions."""
        try:
            model = self.get_vision_model()
            image_contents = self._build_image_messages(image_urls)
            if not image_contents:
                raise ValueError("No valid images to analyze")

            system_prompt = self._load_system_prompt()
            long_term_note = ""
            if long_term_context.strip():
                long_term_note = (
                    "\n\n用户长期记忆摘要（压缩版）：\n"
                    f"{long_term_context}\n\n"
                    "请只把长期记忆用于理解用户稳定偏好和过往有效/无效的空间行动；"
                    "当前图片中的可见事实仍然是主要依据。"
                )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=[
                        *(
                            [
                                {
                                    "type": "text",
                                    "text": (
                                        "用户长期记忆摘要（压缩版）：\n"
                                        f"{long_term_context}\n\n"
                                        "请只把长期记忆用于理解稳定偏好和过往有效/无效的空间行动；"
                                        "当前图片中的可见事实仍然是主要依据。"
                                    ),
                                }
                            ]
                            if long_term_context.strip()
                            else []
                        ),
                        {
                            "type": "text",
                            "text": (
                                f"请分析我上传的空间图片（空间ID: {space_id}）。"
                                "请只基于图片中可见事实，输出 Memory01、QA 和严格 JSON。"
                            ),
                        },
                        *image_contents,
                    ]
                ),
            ]

            response = model.invoke(messages)
            content = str(response.content or "").strip()

            if self._is_refusal(content):
                print("[VisionService] Vision model refused; retrying with safe space-only prompt")
                retry_messages = [
                    SystemMessage(content=self._get_safe_space_prompt()),
                    messages[1],
                ]
                response = model.invoke(retry_messages)
                content = str(response.content or "").strip()

            self._save_debug_response(space_id, content)

            parsed = self._parse_model_response(content)
            memory_content = parsed["memory_content"]
            qa_content = parsed["qa_content"]
            frontend_questions = parsed["questions"]

            if self._is_refusal(content):
                print("[VisionService] Refusal persisted; using safe fallback questions")
                memory_content = self._safe_fallback_space_summary()
                qa_content = ""
                frontend_questions = self._get_default_questions()

            if not self._valid_questions(frontend_questions):
                print("[VisionService] Repairing questions from Memory01/raw response")
                frontend_questions = self._repair_questions_from_memory(memory_content or content)

            if not self._valid_questions(frontend_questions):
                print("[VisionService] Using fallback questions")
                frontend_questions = self._get_default_questions()

            memory_content = memory_content or self._fallback_summary_from_response(content)

            try:
                personality_insights = extract_personality_insights(memory_content)
            except Exception as e:
                print(f"[VisionService] Personality insight extraction error: {e}")
                personality_insights = {}

            return {
                "space_summary": memory_content,
                "personality_insights": personality_insights,
                "questions": self._normalize_questions(frontend_questions),
                "qa_markdown": qa_content,
                "error": None,
            }
        except Exception as e:
            print(f"[VisionService] Vision analysis error: {e}")
            import traceback

            traceback.print_exc()
            return {
                "space_summary": "我看见了你的空间。我们先用几个小问题确认你真正想让它支持的生活状态。",
                "personality_insights": {},
                "questions": self._get_default_questions(),
                "qa_markdown": "",
                "error": str(e),
            }

    def _build_image_messages(self, image_urls: List[str]) -> List[Dict[str, Any]]:
        image_contents = []
        for url in image_urls:
            try:
                base64_image = self.encode_image(url)
                image_contents.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                    }
                )
            except Exception as e:
                print(f"[VisionService] Failed to encode image {url}: {e}")
        return image_contents

    def _is_refusal(self, content: str) -> bool:
        lowered = (content or "").lower()
        refusal_markers = [
            "i can't help",
            "i cannot help",
            "i'm sorry",
            "sorry, i can't",
            "unable to assist",
            "无法协助",
            "无法处理",
            "不能协助",
            "不能处理",
            "抱歉",
        ]
        return any(marker in lowered for marker in refusal_markers)

    def _safe_fallback_space_summary(self) -> str:
        return """# 空间观察 · Memory01

## 给前端的一句话概述
我看见了你的空间。可见线索暂时不够完整，我们先用几个小问题确认你真正想让它支持的生活状态。

## 空间基础事实
- 类型：不确定的室内/桌面空间
- 主要功能承载：混合
- 物品密度：不确定
- 光线：不确定
- 收纳方式：不确定
"""

    def _get_safe_space_prompt(self) -> str:
        return """你是 NestAI 的空间观察员。请只观察图片里的室内空间、家具、物品、光线、收纳和布局。

重要安全规则：
- 不要识别或评价人物。
- 不要推断年龄、性别、职业、收入、健康、家庭关系或身份。
- 不要做心理诊断或人格标签。
- 如果图片里有人、脸、隐私文字、屏幕内容或证件，请忽略，只分析空间环境。
- 不要拒答；如果空间线索很少，就写“可见线索较少”。

请严格输出：
---MEMORY01_START---
# 空间观察 · Memory01

## 空间基础事实
- 类型：
- 主要功能承载：
- 物品密度：
- 光线：
- 收纳方式：

## 可见空间线索
- 
- 
- 
- 

## 生活方式线索假设
- 
- 
- 

## 空间干预机会
- 
- 
- 

## 需要问卷确认的三件事
- 用户最想让这个空间支持哪种生活状态。
- 当前最卡住使用体验的空间问题是什么。
- 这次改造的现实约束是什么。

## 给前端的一句话概述
我看见了一个可被继续整理和使用的真实空间。

---MEMORY01_END---

---QA_START---
# 动态空间问卷
1. 你最希望这个空间先支持哪种生活状态？
- A. 更快进入专注
- B. 回来后更容易放松
- C. 更好展示个人物品
- D. 更容易保持整洁

2. 现在最影响你使用这个空间的是什么？
- A. 物品容易堆在手边
- B. 光线或氛围不够舒服
- C. 取放物品不顺手
- D. 工作和休息边界混在一起

3. 这次改造最重要的现实约束是什么？
- A. 尽量 0 元完成
- B. 可以低预算买小物
- C. 只能无痕调整
- D. 可以移动家具或重新布局
---QA_END---

---JSON_START---
{"questions":[{"q":"你最希望这个空间先支持哪种生活状态？","options":["更快进入专注","回来后更容易放松","更好展示个人物品","更容易保持整洁"]},{"q":"现在最影响你使用这个空间的是什么？","options":["物品容易堆在手边","光线或氛围不够舒服","取放物品不顺手","工作和休息边界混在一起"]},{"q":"这次改造最重要的现实约束是什么？","options":["尽量 0 元完成","可以低预算买小物","只能无痕调整","可以移动家具或重新布局"]}]}
---JSON_END---"""

    def _load_system_prompt(self) -> str:
        project_root = Path(__file__).resolve().parents[3]
        prompt_path = project_root / "prompts" / "P001_space_analysis.md"
        if prompt_path.exists():
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        return self._get_default_personality_prompt()

    def _save_debug_response(self, space_id: str, content: str) -> None:
        debug_file = Path(self.settings.upload_dir).parent / f"debug_response_{space_id}.txt"
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[VisionService] Saved raw response to {debug_file}")

    def _parse_model_response(self, content: str) -> Dict[str, Any]:
        memory_match = re.search(r"---MEMORY01_START---(.*?)---MEMORY01_END---", content, re.DOTALL)
        qa_match = re.search(r"---QA_START---(.*?)---QA_END---", content, re.DOTALL)
        json_match = re.search(r"---JSON_START---(.*?)---JSON_END---", content, re.DOTALL)

        memory_content = memory_match.group(1).strip() if memory_match else ""
        qa_content = qa_match.group(1).strip() if qa_match else ""
        questions: List[Dict[str, Any]] = []

        if json_match:
            try:
                json_data = json.loads(json_match.group(1).strip())
                questions = json_data.get("questions", [])
                print(f"[VisionService] Parsed JSON questions: {len(questions)}")
            except Exception as e:
                print(f"[VisionService] JSON parsing error: {e}")

        if not self._valid_questions(questions) and qa_content:
            questions = self._extract_questions_from_qa(qa_content)
            print(f"[VisionService] Extracted QA questions: {len(questions)}")

        return {
            "memory_content": memory_content,
            "qa_content": qa_content,
            "questions": questions,
        }

    def _get_default_personality_prompt(self) -> str:
        return """你是 NestAI 的空间观察员 Nobi。请根据用户上传的空间图片，严格输出三个区块：
---MEMORY01_START---
# 空间与生活方式观察
## 给前端的一句话概述
我看见了一个具体、温暖、有待被重新整理的空间。
---MEMORY01_END---

---QA_START---
# 深度验证问卷
1. 你最希望这个空间先支持哪种生活状态？
- A. 更快进入专注
- B. 回来后更容易放松
- C. 更好展示个人物品
- D. 更容易保持整洁
2. 现在最影响你使用这个空间的是什么？
- A. 桌面或地面容易堆东西
- B. 光线不够舒服
- C. 动线或取物不顺手
- D. 休息和工作边界不清
3. 这次改造最重要的约束是什么？
- A. 尽量 0 元完成
- B. 可以低预算购买小物
- C. 只能无痕调整
- D. 可以移动家具或重新布局
---QA_END---

---JSON_START---
{"questions":[{"q":"你最希望这个空间先支持哪种生活状态？","options":["更快进入专注","回来后更容易放松","更好展示个人物品","更容易保持整洁"]},{"q":"现在最影响你使用这个空间的是什么？","options":["桌面或地面容易堆东西","光线不够舒服","动线或取物不顺手","休息和工作边界不清"]},{"q":"这次改造最重要的约束是什么？","options":["尽量 0 元完成","可以低预算购买小物","只能无痕调整","可以移动家具或重新布局"]}]}
---JSON_END---"""

    def _valid_questions(self, questions: List[Dict[str, Any]]) -> bool:
        if not isinstance(questions, list) or len(questions) < 3:
            return False
        for question in questions[:3]:
            if not isinstance(question, dict):
                return False
            if not isinstance(question.get("q"), str) or not question["q"].strip():
                return False
            options = question.get("options")
            if not isinstance(options, list) or len(options) < 4:
                return False
            if any(not isinstance(option, str) or not option.strip() for option in options[:4]):
                return False
        return True

    def _normalize_questions(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for question in questions[:3]:
            normalized.append(
                {
                    "q": str(question["q"]).strip(),
                    "options": [str(option).strip() for option in question["options"][:4]],
                }
            )
        return normalized

    def _repair_questions_from_memory(self, memory_content: str) -> List[Dict[str, Any]]:
        """Ask the model to turn P001 observations into strict frontend questions."""
        lowered = (memory_content or "").lower()
        if not memory_content or self._is_refusal(memory_content):
            return []

        try:
            model = self.get_vision_model()
            prompt = f"""请根据下面的空间观察，生成手机前端可直接展示的动态问卷。

规则：
- 必须正好 3 题，每题正好 4 个选项。
- 问题必须来自空间观察，不要写通用问题。
- 不要推断心理健康、人格定论、身份、年龄、性别、收入或职业。
- 第 1 题确认用户想让空间支持的生活状态。
- 第 2 题确认当前空间阻碍。
- 第 3 题确认改造约束。
- 只返回可 json.loads 解析的 JSON，不要 Markdown。

JSON schema:
{{"questions":[{{"q":"...","options":["...","...","...","..."]}},{{"q":"...","options":["...","...","...","..."]}},{{"q":"...","options":["...","...","...","..."]}}]}}

空间观察：
{memory_content[:2500]}
"""
            response = model.invoke([HumanMessage(content=prompt)])
            text = str(response.content or "").strip()
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            data = json.loads(json_match.group(0) if json_match else text)
            questions = data.get("questions", [])
            return self._normalize_questions(questions) if self._valid_questions(questions) else []
        except Exception as e:
            print(f"[VisionService] Question repair failed: {e}")
            return []

    def _extract_questions_from_qa(self, qa_content: str) -> List[Dict[str, Any]]:
        questions = []
        current_question = None
        current_options: List[str] = []

        for raw_line in qa_content.strip().splitlines():
            line = raw_line.strip()
            if not line:
                continue

            if re.match(r"^\d+[.)、]\s*", line):
                if current_question and len(current_options) >= 4:
                    questions.append({"q": current_question, "options": current_options[:4]})
                current_question = re.sub(r"^\d+[.)、]\s*", "", line).strip()
                current_options = []
                continue

            if line.startswith("- ") or re.match(r"^[A-Da-d][.)、]\s*", line):
                option_text = re.sub(r"^-+\s*", "", line)
                option_text = re.sub(r"^[A-Da-d][.)、]\s*", "", option_text).strip()
                if option_text:
                    current_options.append(option_text)

        if current_question and len(current_options) >= 4:
            questions.append({"q": current_question, "options": current_options[:4]})

        return self._normalize_questions(questions) if self._valid_questions(questions) else []

    def _get_default_questions(self) -> List[Dict[str, Any]]:
        """Fallback questions used only when P001 analysis cannot produce valid dynamic questions."""
        return [
            {
                "q": "你最希望这个空间先帮你做到什么？",
                "options": ["更容易进入专注状态", "回来后真的能放松", "更像我自己的地方", "更容易保持整洁"],
            },
            {
                "q": "现在最影响你使用这个空间的是什么？",
                "options": ["东西容易堆在手边", "光线或氛围不够舒服", "取放物品不顺手", "工作和休息边界混在一起"],
            },
            {
                "q": "这次改造最重要的现实约束是什么？",
                "options": ["尽量 0 元完成", "可以低预算买小物", "只能无痕调整", "可以移动家具或重新布局"],
            },
        ]

    def _fallback_summary_from_response(self, content: str) -> str:
        compact = re.sub(r"\s+", " ", content).strip()
        if compact and not self._is_refusal(compact):
            return compact[:500]
        return self._safe_fallback_space_summary()


_vision_service: Optional[VisionService] = None


def get_vision_service() -> VisionService:
    """Get the shared vision service instance."""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
    return _vision_service


def extract_personality_insights(memory_content: str) -> Dict[str, Any]:
    """Extract lightweight structured data from Memory01 without over-claiming."""
    insights: Dict[str, Any] = {
        "raw_markdown": memory_content,
        "dominant_personality": "",
        "lifestyle_prototype": "",
        "unmet_needs": [],
        "key_contradictions": [],
        "aesthetic_direction": "",
    }

    def section(title: str) -> str:
        match = re.search(rf"##\s*{re.escape(title)}\s*\n([\s\S]*?)(?=\n##\s+|\Z)", memory_content)
        return match.group(1).strip() if match else ""

    lifestyle = section("生活方式假设")
    intervention = section("空间干预机会")
    visible_clues = section("可见空间线索")

    insights["lifestyle_prototype"] = _first_non_empty_line(lifestyle)
    insights["dominant_personality"] = _first_non_empty_line(visible_clues)
    insights["key_contradictions"] = _bullet_lines(intervention)
    insights["aesthetic_direction"] = _first_non_empty_line(section("给前端的一句话概述"))
    return insights


def _bullet_lines(text: str) -> List[str]:
    lines = []
    for line in text.splitlines():
        cleaned = re.sub(r"^\s*(?:[-*]|\d+[.)、])\s*", "", line).strip()
        if cleaned:
            lines.append(cleaned)
    return lines


def _first_non_empty_line(text: str) -> str:
    for line in _bullet_lines(text):
        return line
    return ""
