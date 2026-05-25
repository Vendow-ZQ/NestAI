"""
QA转换器 - 将丰富的QA.md转换为前端可用格式

把人格化分析的深度QA转换为前端问卷格式，
同时保留完整元数据供后端使用。
"""

import re
import json
from typing import List, Dict, Any, Optional
from pathlib import Path


class QAConverter:
    """QA格式转换器"""

    @staticmethod
    def parse_qa_markdown(qa_content: str) -> List[Dict[str, Any]]:
        """
        解析QA.md为结构化数据

        输入QA.md格式:
            ## 问题1：[验证标题]
            **我们想验证的推断**：...
            **观察证据**：...
            **问题**：具体问题文本
            **选项**：
            - A. 选项1
            - B. 选项2

        返回：
            [{
                "id": 1,
                "validation_target": "验证标题",
                "inference": "我们想验证的推断",
                "evidence": "观察证据",
                "question_text": "具体问题文本",
                "options": ["选项1", "选项2", "选项3", "选项4"],
                "design_intent": "设计意图"
            }]
        """
        questions = []

        # 分割各个问题
        question_blocks = re.split(r'## 问题\d+', qa_content)

        for idx, block in enumerate(question_blocks[1:], 1):  # 跳过第一个空块
            question_data = {"id": idx}

            # 提取验证标题（方括号内的内容）
            title_match = re.search(r'\[([一-龥a-zA-Z]+)\]', block)
            if title_match:
                question_data["validation_target"] = title_match.group(1)

            # 提取各个字段
            fields = {
                "inference": r'\*\*我们想验证的推断\*\*[:：](.*?)(?=\*\*|##|$)',
                "evidence": r'\*\*观察证据\*\*[:：](.*?)(?=\*\*|##|$)',
                "question_text": r'\*\*问题\*\*[:：](.*?)(?=\*\*|##|$)',
                "design_intent": r'\*\*设计意图\*\*[:：](.*?)(?=\*\*|##|$)'
            }

            for field, pattern in fields.items():
                match = re.search(pattern, block, re.DOTALL)
                if match:
                    question_data[field] = match.group(1).strip()

            # 提取选项
            options = []
            option_matches = re.findall(r'- [A-D]\.\s*(.+?)(?=\n|$)', block)
            if option_matches:
                options = [opt.strip() for opt in option_matches]
            else:
                # 尝试其他格式（如"- 选项内容"）
                option_matches = re.findall(r'-\s+(.+?)(?=\n|$)', block)
                options = [opt.strip() for opt in option_matches if opt.strip()]

            question_data["options"] = options

            questions.append(question_data)

        return questions

    @staticmethod
    def to_frontend_format(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        转换为前端问卷格式（简化版）

        返回：
            [{"q": "问题文本", "options": ["选项1", "选项2"]}, ...]
        """
        frontend_questions = []

        for q in questions:
            frontend_q = {
                "q": q.get("question_text", "问题"),
                "options": q.get("options", [])
            }
            frontend_questions.append(frontend_q)

        return frontend_questions

    @staticmethod
    def to_json_schema(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        转换为完整的JSON Schema（供后端使用）

        包含完整的验证逻辑和元数据
        """
        return {
            "version": "2.0",
            "question_count": len(questions),
            "questions": questions,
            "validation_map": {
                q["validation_target"]: {
                    "question_id": q["id"],
                    "inference": q["inference"],
                    "evidence": q["evidence"]
                }
                for q in questions if "validation_target" in q
            }
        }

    @staticmethod
    def apply_user_answers(questions: List[Dict[str, Any]], answers: Dict[int, str]) -> List[Dict[str, Any]]:
        """
        整合用户回答到问题数据

        answers: {question_id: "A"} 或 {question_id: "选项文本"}
        """
        enriched_questions = []

        for q in questions:
            q_with_answer = q.copy()
            if q["id"] in answers:
                answer = answers[q["id"]]
                q_with_answer["user_answer"] = answer

                # 解析回答含义
                if answer in ["A", "B", "C", "D"]:
                    option_idx = ord(answer) - ord('A')
                    if option_idx < len(q["options"]):
                        q_with_answer["user_answer_text"] = q["options"][option_idx]
                else:
                    q_with_answer["user_answer_text"] = answer

            enriched_questions.append(q_with_answer)

        return enriched_questions


def convert_qa_markdown_to_frontend(qa_md_content: str) -> tuple:
    """
    一站式转换函数

    返回: (frontend_questions, full_schema)
    """
    converter = QAConverter()

    # 解析QA.md
    parsed_questions = converter.parse_qa_markdown(qa_md_content)

    # 转换为前端格式
    frontend_format = converter.to_frontend_format(parsed_questions)

    # 生成完整Schema
    full_schema = converter.to_json_schema(parsed_questions)

    return frontend_format, full_schema


# 测试代码
if __name__ == "__main__":
    # 示例QA.md内容
    sample_qa = """
# 深度验证问卷

## 问题1：[验证主导人格特质]
**我们想验证的推断**：用户是功能导向型极简主义者

**观察证据**：
- 书桌上几乎无物
- 环境简约整洁

**问题**：
当你设计工作空间时，你最关注哪一点？

**选项**：
- A. 功能性和高效
- B. 美观和风格
- C. 舒适和放松
- D. 灵感和创意

**设计意图**：
确认人格特质以调整干预策略

---

## 问题2：[验证生活方式]
**我们想验证的推断**：用户是极简主义者

**观察证据**：
- 环境简洁，物品极少

**问题**：
你如何描述你的理想生活方式？

**选项**：
- A. 简单而高效
- B. 丰富而多样
- C. 舒适而温馨
- D. 创意和灵感
"""

    converter = QAConverter()
    questions = converter.parse_qa_markdown(sample_qa)

    print("解析结果:")
    for q in questions:
        print(f"\n问题 {q['id']}: {q.get('validation_target', '')}")
        print(f"文本: {q.get('question_text', '')[:50]}...")
        print(f"选项: {q.get('options', [])}")

    frontend, schema = convert_qa_markdown_to_frontend(sample_qa)

    print("\n\n前端格式:")
    print(json.dumps(frontend, ensure_ascii=False, indent=2))
