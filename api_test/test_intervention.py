"""
改造方案生成测试脚本 (P002)

流程：
1. 读取 Memory01_*.md (空间记忆档案)
2. 读取 QA_*.md 和用户回答 (手动填写)
3. 读取 Prompt2.md (改造策略提示词)
4. 调用 GPT-4o 生成改造方案
5. 输出 Memory02.md (改造策略档案)

环境变量：
- OPENAI_API_KEY
"""

import os
import re
import glob
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def find_latest_file(pattern):
    """查找最新的匹配文件"""
    files = list(Path(__file__).parent.glob(pattern))
    if not files:
        return None
    return max(files, key=lambda p: p.stat().st_mtime)

def load_file(filepath):
    """读取文件内容"""
    if not filepath or not Path(filepath).exists():
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def load_user_answers():
    """
    加载用户回答
    优先顺序：
    1. QA_answers.md (用户手动填写)
    2. 从 QA_*.md 提取问题框架
    3. 使用默认回答
    """
    # 尝试找用户填写的答案
    answers_path = Path(__file__).parent / "QA_answers.md"
    if answers_path.exists():
        with open(answers_path, "r", encoding="utf-8") as f:
            return f.read()

    # 如果没有，返回None，让主函数处理
    return None

def generate_intervention(memory01, qa_content, user_answers, prompt):
    """调用 GPT-4o 生成改造方案"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("请设置 OPENAI_API_KEY")

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    print("[LLM] 正在生成改造方案...")

    # 构建完整提示
    full_prompt = f"""{prompt}

## 输入资料

### 空间记忆档案 (Memory01)
{memory01}

### 信息补全问卷 (Q&A)
{qa_content}

### 用户回答
{user_answers if user_answers else "[用户暂未提供详细回答，请基于空间记忆档案生成合理推测，并在方案中标注哪些是基于推测的假设]"}

请基于以上信息，生成完整的空间改造策略档案 (Memory02.md 格式)。
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": full_prompt},
            {"role": "user", "content": "请生成空间改造策略档案"}
        ],
        max_tokens=4000,
        temperature=0.7
    )

    return response.choices[0].message.content

def save_output(content):
    """保存 Memory02.md"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = Path(__file__).parent / f"Memory02_{timestamp}.md"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    return output_path

def extract_summary(content):
    """提取方案摘要"""
    # 提取Level 1行动数
    level1_count = len(re.findall(r'### Level 1.*?#### 行动', content, re.DOTALL))
    # 提取Level 2行动数
    level2_count = len(re.findall(r'### Level 2.*?#### 行动', content, re.DOTALL))
    # 提取Level 3行动数
    level3_count = len(re.findall(r'### Level 3.*?#### 行动', content, re.DOTALL))

    # 提取预算信息
    budget_match = re.search(r'预算范围[：:]\s*(.+)', content)
    budget = budget_match.group(1).strip() if budget_match else "未明确"

    return {
        "level1": level1_count,
        "level2": level2_count,
        "level3": level3_count,
        "budget": budget
    }

def main():
    print("=" * 60)
    print("NestAI 改造方案生成 (P002)")
    print("=" * 60)

    # 1. 加载 Memory01
    print("\n[1/4] 加载空间记忆档案...")
    memory_file = find_latest_file("Memory01_*.md")
    if not memory_file:
        print("[ERROR] 未找到 Memory01_*.md 文件，请先运行 test_vision_v2.py")
        return
    memory01 = load_file(memory_file)
    print(f"[OK] 加载: {memory_file.name}")

    # 2. 加载 QA
    print("\n[2/4] 加载信息补全问卷...")
    qa_file = find_latest_file("QA_*.md")
    if not qa_file:
        print("[ERROR] 未找到 QA_*.md 文件，请先运行 test_vision_v2.py")
        return
    qa_content = load_file(qa_file)
    print(f"[OK] 加载: {qa_file.name}")

    # 3. 加载用户回答
    print("\n[3/4] 加载用户回答...")
    user_answers = load_user_answers()
    if user_answers:
        print("[OK] 找到用户回答 (QA_answers.md)")
    else:
        print("[INFO] 未找到用户回答，将基于推测生成方案")
        print("[TIP] 如需提供回答，请创建 QA_answers.md 文件")

    # 4. 加载 Prompt2
    print("\n[4/4] 加载改造策略提示词...")
    prompt_path = Path(__file__).parent / "Prompt2.md"
    if not prompt_path.exists():
        print("[ERROR] 未找到 Prompt2.md")
        return
    prompt = load_file(prompt_path)
    print(f"[OK] Prompt 长度: {len(prompt)} 字符")

    # 5. 生成方案
    print("\n[LLM] 生成改造方案中（预计 15-30 秒）...")
    try:
        result = generate_intervention(memory01, qa_content, user_answers, prompt)
        print("[OK] 方案生成完成")
    except Exception as e:
        print(f"[ERROR] 调用失败: {e}")
        return

    # 6. 保存结果
    output_path = save_output(result)
    print(f"\n[OK] 改造策略已保存: {output_path}")

    # 7. 显示摘要
    summary = extract_summary(result)
    print("\n" + "=" * 60)
    print("方案摘要")
    print("=" * 60)
    print(f"Level 1 (今晚): {summary['level1']} 个行动")
    print(f"Level 2 (本周): {summary['level2']} 个行动")
    print(f"Level 3 (本月): {summary['level3']} 个行动")
    print(f"预算范围: {summary['budget']}")
    print(f"\n详细方案请查看: {output_path}")

if __name__ == "__main__":
    main()
