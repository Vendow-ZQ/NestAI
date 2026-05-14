"""
视觉分析测试脚本 v2 - 多图深度分析

流程：
1. 读取 api_test/pic/Pic1.jpg, Pic2.jpg（多张图片建立整体理解）
2. 读取 api_test/Prompt1_v2.md（深度分析提示词）
3. 调用 GPT-4o 分析
4. 分离输出：
   - Memory01.md: 空间记忆档案
   - Q&A.md: 信息补全问卷

环境变量：
- OPENAI_API_KEY
"""

import os
import re
import base64
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

PIC_DIR = Path(__file__).parent / "pic"

def load_images():
    """读取所有 Pic*.jpg 图片"""
    images = []
    for img_path in sorted(PIC_DIR.glob("Pic*.jpg")):
        with open(img_path, "rb") as f:
            image_bytes = f.read()
            images.append({
                "name": img_path.name,
                "base64": base64.b64encode(image_bytes).decode("utf-8")
            })
    return images

def load_prompt():
    """读取 Prompt1.md"""
    prompt_path = Path(__file__).parent / "Prompt1.md"
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

def analyze_with_vision(images, prompt):
    """调用 GPT-4o 分析多张图片"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("请设置 OPENAI_API_KEY")

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    print(f"[LLM] 正在分析 {len(images)} 张图片...")

    # 构建消息内容
    content = [
        {
            "type": "text",
            "text": f"请分析我上传的{len(images)}张空间图片。这是同一个房间的不同角度，请综合观察建立整体理解，生成空间记忆档案和信息补全问卷。"
        }
    ]

    # 添加所有图片
    for img in images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{img['base64']}"
            }
        })

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ],
        max_tokens=4000,
        temperature=0.7
    )

    return response.choices[0].message.content

def parse_outputs(raw_content):
    """解析分离两个输出文件"""
    # 提取 Memory01
    memory_match = re.search(r'---MEMORY01_START---(.*?)---MEMORY01_END---', raw_content, re.DOTALL)
    memory_content = memory_match.group(1).strip() if memory_match else ""

    # 提取 Q&A
    qa_match = re.search(r'---QA_START---(.*?)---QA_END---', raw_content, re.DOTALL)
    qa_content = qa_match.group(1).strip() if qa_match else ""

    return memory_content, qa_content

def save_outputs(memory, qa):
    """保存两个输出文件"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Memory01.md
    memory_path = Path(__file__).parent / f"Memory01_{timestamp}.md"
    with open(memory_path, "w", encoding="utf-8") as f:
        f.write(memory)

    # Q&A.md
    qa_path = Path(__file__).parent / f"QA_{timestamp}.md"
    with open(qa_path, "w", encoding="utf-8") as f:
        f.write(qa)

    return memory_path, qa_path

def main():
    print("=" * 60)
    print("NestAI 深度视觉分析 v2 (多图版)")
    print("=" * 60)

    # 1. 读取图片
    print("\n[1/4] 读取空间图片...")
    images = load_images()
    if not images:
        print("[ERROR] 未找到 Pic*.jpg 图片，请放到 api_test/pic/ 目录")
        return
    print(f"[OK] 找到 {len(images)} 张图片: {[img['name'] for img in images]}")

    # 2. 读取 Prompt
    print("\n[2/4] 读取深度分析提示词...")
    prompt = load_prompt()
    print(f"[OK] Prompt 长度: {len(prompt)} 字符")

    # 3. 调用 LLM
    print("\n[3/4] GPT-4o 深度分析中（预计 10-30 秒）...")
    try:
        result = analyze_with_vision(images, prompt)
        print("[OK] 分析完成")
    except Exception as e:
        print(f"[ERROR] 调用失败: {e}")
        return

    # 4. 解析并保存
    print("\n[4/4] 分离并保存结果...")
    memory, qa = parse_outputs(result)

    if not memory or not qa:
        print("[WARNING] 未能正确解析输出格式，保存原始结果...")
        raw_path = Path(__file__).parent / "raw_output.md"
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"[OK] 原始结果保存到: {raw_path}")
        return

    memory_path, qa_path = save_outputs(memory, qa)
    print(f"[OK] 空间记忆: {memory_path}")
    print(f"[OK] 补全问卷: {qa_path}")

    # 5. 显示摘要
    print("\n" + "=" * 60)
    print("分析完成摘要")
    print("=" * 60)
    print(f"\n空间类型: {extract_field(memory, '类型')}")
    print(f"面积估算: {extract_field(memory, '面积')}")
    print(f"问题数量: {qa.count('## 问题')}")

def extract_field(text, field_name):
    """简单字段提取"""
    match = re.search(rf'{field_name}[：:]\s*(.+)', text)
    return match.group(1).strip() if match else "未识别"

if __name__ == "__main__":
    main()
