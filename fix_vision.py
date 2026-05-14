#!/usr/bin/env python
"""修复vision_service.py文件"""

# 读取原文件（前236行）
with open(r'D:\Code\NestAI\python-server\app\services\vision_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 保留前236行
fixed_content = ''.join(lines[:236])

# 添加修复后的函数
fixed_function = '''

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
        personality_match = re.search(r"### 主导人格特质\\s*\\n(.+?)\\n", memory_content)
        if personality_match:
            insights["dominant_personality"] = personality_match.group(1).strip()

        # 提取生活方式原型
        prototype_match = re.search(r"### 生活方式原型\\s*\\n(.+?)\\n", memory_content)
        if prototype_match:
            insights["lifestyle_prototype"] = prototype_match.group(1).strip()

        # 提取未满足的心理需求
        needs_section = re.search(r"### 未满足的心理需求.*?\\n([\\s\\S]*?)(?=###|##|$)", memory_content)
        if needs_section:
            needs_text = needs_section.group(1)
            needs = re.findall(r"\\d+\\.\\s*(.+?)\\n", needs_text)
            insights["unmet_needs"] = [n.strip() for n in needs if n.strip()]

        # 提取关键矛盾点
        contradictions_section = re.search(r"### 关键矛盾点.*?\\n([\\s\\S]*?)(?=###|##|$)", memory_content)
        if contradictions_section:
            contradictions_text = contradictions_section.group(1)
            contradictions = re.findall(r"\\d+\\.\\s*(.+?)\\n", contradictions_text)
            insights["key_contradictions"] = [c.strip() for c in contradictions if c.strip()]

        # 提取审美方向
        aesthetic_match = re.search(r"### 审美心理.*?\\n([\\s\\S]*?)(?=###|##|$)", memory_content)
        if aesthetic_match:
            aesthetic_text = aesthetic_match.group(1)
            color_match = re.search(r"色彩[:\\s]+(.+?)\\n", aesthetic_text)
            if color_match:
                insights["aesthetic_direction"] += "色彩: " + color_match.group(1).strip() + "; "
    except Exception as e:
        print(f"Extract personality insights error: {e}")

    return insights
'''

fixed_content += fixed_function

# 写回文件
with open(r'D:\Code\NestAI\python-server\app\services\vision_service.py', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("文件已修复")
