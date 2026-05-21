"""
上传流程诊断测试

模拟前端完整上传流程，检测瓶颈
"""

import requests
import time
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_upload_flow():
    """测试完整上传流程"""

    print("=" * 60)
    print("上传流程诊断测试")
    print("=" * 60)

    # 1. 测试上传图片
    print("\n[1/4] 测试图片上传...")
    project_dir = Path(__file__).resolve().parents[2]
    image_path = project_dir / "tests" / "assets" / "images" / "Pic1.jpg"

    if not image_path.exists():
        print(f"[ERROR] 图片不存在: {image_path}")
        return

    with open(image_path, "rb") as f:
        files = {"images": ("Pic1.jpg", f, "image/jpeg")}
        start = time.time()
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        elapsed = time.time() - start

    print(f"[OK] 上传耗时: {elapsed:.2f}s")

    if response.status_code != 200:
        print(f"[ERROR] 上传失败: {response.status_code}")
        print(response.text)
        return

    upload_data = response.json()
    image_url = upload_data["data"]["urls"][0]
    print(f"[OK] 图片URL: {image_url}")

    # 2. 创建space
    print("\n[2/4] 创建space...")
    start = time.time()
    response = requests.post(
        f"{BASE_URL}/api/spaces",
        json={"images": [image_url]}
    )
    elapsed = time.time() - start

    print(f"[OK] 创建space耗时: {elapsed:.2f}s")

    if response.status_code != 200:
        print(f"[ERROR] 创建space失败: {response.status_code}")
        print(response.text)
        return

    space_data = response.json()
    space_id = space_data["data"].get("id") or space_data["data"].get("spaceId")
    print(f"[OK] Space ID: {space_id}")

    # 3. 创建session
    print("\n[3/4] 创建session...")
    start = time.time()
    response = requests.post(
        f"{BASE_URL}/api/sessions",
        json={"spaceId": space_id, "images": [image_url]}
    )
    elapsed = time.time() - start

    print(f"[OK] 创建session耗时: {elapsed:.2f}s")

    if response.status_code != 200:
        print(f"[ERROR] 创建session失败: {response.status_code}")
        print(response.text)
        return

    session_data = response.json()
    session_id = session_data["data"].get("id") or session_data["data"].get("sessionId")
    print(f"[OK] Session ID: {session_id}")

    # 4. 调用analyze（这是最可能超时的步骤）
    print("\n[4/4] 调用analyze（GPT-4o视觉分析，预计10-30秒）...")
    print("[INFO] 如果这步卡住超过60秒，说明后端GPT调用有问题")

    start = time.time()
    try:
        response = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/analyze",
            timeout=120  # 120秒超时
        )
        elapsed = time.time() - start

        print(f"[OK] Analyze耗时: {elapsed:.2f}s")

        if response.status_code != 200:
            print(f"[ERROR] Analyze失败: {response.status_code}")
            print(response.text)
            return

        analyze_data = response.json()
        print(f"[OK] 分析成功!")
        print(f"\n生成问题数: {len(analyze_data['data']['questions'])}")
        print(f"人格洞察: {analyze_data['data'].get('spaceSummary', '')[:200]}...")

        # 保存结果
        output_path = Path(__file__).parent / "last_analyze_result.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(analyze_data, f, ensure_ascii=False, indent=2)
        print(f"\n[OK] 完整结果保存到: {output_path}")

    except requests.Timeout:
        print(f"[ERROR] Analyze超时! 超过120秒未响应")
        print("[TIP] 可能的原因:")
        print("  1. GPT-4o API响应慢或被限制")
        print("  2. 后端处理图片耗时过长")
        print("  3. 网络不稳定")
    except Exception as e:
        print(f"[ERROR] Analyze异常: {e}")

if __name__ == "__main__":
    test_upload_flow()
