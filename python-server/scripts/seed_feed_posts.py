"""Seed Grow feed posts from python-server/uploads/feed-seed images.

Usage:
    cd python-server
    python scripts/seed_feed_posts.py
"""

from __future__ import annotations

from pathlib import Path
import sys


SERVER_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_ROOT))

from app.services.memory_service import MemoryService, get_db, init_db  # noqa: E402


POST_COPY = [
    {
        "user_name": "Mina",
        "title": "把客厅留白，还给下午的光",
        "description": "这个 Next 像一次减法：先让休息区安静下来，再决定什么真正值得留下。",
        "keywords": ["留白", "自然光", "慢休息"],
    },
    {
        "user_name": "Theo",
        "title": "把沙发区变成柔软的会客岛",
        "description": "圆形茶几和低位坐感把空间围成一个低声聊天的中心，温暖但不拥挤。",
        "keywords": ["会客", "暖色", "围合感"],
    },
    {
        "user_name": "Jun",
        "title": "给开放客厅一条更清晰的动线",
        "description": "这一步不是大改，而是让走动、坐下、取物都更顺手。",
        "keywords": ["动线", "展示架", "清爽客厅"],
    },
    {
        "user_name": "Avery",
        "title": "把阳光和彩色留给朋友们",
        "description": "压缩桌面杂物，把视觉焦点留给艺术墙、光线和围坐感。",
        "keywords": ["社交客厅", "艺术墙", "高能量"],
    },
    {
        "user_name": "Lena",
        "title": "把复古红调整理成夜晚客厅",
        "description": "重点放在灯光层次，让白天的浓烈切换到夜里的柔和。",
        "keywords": ["复古", "灯光", "夜晚模式"],
    },
    {
        "user_name": "Kai",
        "title": "让工业感空间多一点植物的呼吸",
        "description": "保留结构感，用绿植和低位坐具让工作区更能久待。",
        "keywords": ["工业感", "绿植", "工作休息"],
    },
    {
        "user_name": "Nora",
        "title": "把海景客厅收束成一个放松仪式",
        "description": "减少中心区物品，让窗外视野和一盏主灯成为真正的主角。",
        "keywords": ["景观", "仪式感", "放松"],
    },
    {
        "user_name": "Rin",
        "title": "给弧形沙发一个更温柔的晚间场景",
        "description": "用托盘和主灯固定夜晚节奏，让聚会后的安静更容易发生。",
        "keywords": ["弧形沙发", "晚间", "聚会后"],
    },
    {
        "user_name": "Sol",
        "title": "让彩色玻璃成为客厅的主角",
        "description": "减少抢戏装饰，让每天不同时刻的光成为空间表情。",
        "keywords": ["彩色玻璃", "光影", "主角感"],
    },
    {
        "user_name": "Mo",
        "title": "把绿意圆窗留给一张真正能休息的床",
        "description": "控制床边物品，只留下睡前会用到的书、灯和一杯水。",
        "keywords": ["卧室", "绿意", "睡前秩序"],
    },
    {
        "user_name": "Iris",
        "title": "把森林窗边整理成阅读角",
        "description": "固定植物、灯和茶几的位置，让坐下这件事更容易发生。",
        "keywords": ["阅读角", "森林感", "坐下"],
    },
]


def main() -> None:
    init_db()
    db = next(get_db())
    seed_dir = SERVER_ROOT / "uploads" / "feed-seed"

    try:
        service = MemoryService(db)
        count = 0
        for index, copy in enumerate(POST_COPY, start=1):
            image_name = f"{index}.jpg"
            image_path = seed_dir / image_name
            if not image_path.exists():
                continue

            service.upsert_feed_post(
                {
                    "id": f"seed-{index}",
                    "user_id": f"seed_user_{index}",
                    "user_name": copy["user_name"],
                    "user_avatar": "",
                    "title": copy["title"],
                    "description": copy["description"],
                    "image_url": f"/uploads/feed-seed/{image_name}",
                    "location": "Shared Next",
                    "lifestyle_keywords": copy["keywords"],
                    "status": "published",
                    "source": "feed-seed",
                }
            )
            count += 1
        print(f"Seeded {count} feed posts from {seed_dir}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
