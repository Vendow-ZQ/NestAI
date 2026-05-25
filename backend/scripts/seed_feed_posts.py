"""Seed Grow feed posts from backend/uploads/feed-seed images.

Usage:
    cd backend
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
        "title": "鎶婂鍘呯暀鐧斤紝杩樼粰涓嬪崍鐨勫厜",
        "description": "杩欎釜 Next 鍍忎竴娆″噺娉曪細鍏堣浼戞伅鍖哄畨闈欎笅鏉ワ紝鍐嶅喅瀹氫粈涔堢湡姝ｅ€煎緱鐣欎笅銆?,
        "keywords": ["鐣欑櫧", "鑷劧鍏?, "鎱紤鎭?],
    },
    {
        "user_name": "Theo",
        "title": "鎶婃矙鍙戝尯鍙樻垚鏌旇蒋鐨勪細瀹㈠矝",
        "description": "鍦嗗舰鑼跺嚑鍜屼綆浣嶅潗鎰熸妸绌洪棿鍥存垚涓€涓綆澹拌亰澶╃殑涓績锛屾俯鏆栦絾涓嶆嫢鎸ゃ€?,
        "keywords": ["浼氬", "鏆栬壊", "鍥村悎鎰?],
    },
    {
        "user_name": "Jun",
        "title": "缁欏紑鏀惧鍘呬竴鏉℃洿娓呮櫚鐨勫姩绾?,
        "description": "杩欎竴姝ヤ笉鏄ぇ鏀癸紝鑰屾槸璁╄蛋鍔ㄣ€佸潗涓嬨€佸彇鐗╅兘鏇撮『鎵嬨€?,
        "keywords": ["鍔ㄧ嚎", "灞曠ず鏋?, "娓呯埥瀹㈠巺"],
    },
    {
        "user_name": "Avery",
        "title": "鎶婇槼鍏夊拰褰╄壊鐣欑粰鏈嬪弸浠?,
        "description": "鍘嬬缉妗岄潰鏉傜墿锛屾妸瑙嗚鐒︾偣鐣欑粰鑹烘湳澧欍€佸厜绾垮拰鍥村潗鎰熴€?,
        "keywords": ["绀句氦瀹㈠巺", "鑹烘湳澧?, "楂樿兘閲?],
    },
    {
        "user_name": "Lena",
        "title": "鎶婂鍙ょ孩璋冩暣鐞嗘垚澶滄櫄瀹㈠巺",
        "description": "閲嶇偣鏀惧湪鐏厜灞傛锛岃鐧藉ぉ鐨勬祿鐑堝垏鎹㈠埌澶滈噷鐨勬煍鍜屻€?,
        "keywords": ["澶嶅彜", "鐏厜", "澶滄櫄妯″紡"],
    },
    {
        "user_name": "Kai",
        "title": "璁╁伐涓氭劅绌洪棿澶氫竴鐐规鐗╃殑鍛煎惛",
        "description": "淇濈暀缁撴瀯鎰燂紝鐢ㄧ豢妞嶅拰浣庝綅鍧愬叿璁╁伐浣滃尯鏇磋兘涔呭緟銆?,
        "keywords": ["宸ヤ笟鎰?, "缁挎", "宸ヤ綔浼戞伅"],
    },
    {
        "user_name": "Nora",
        "title": "鎶婃捣鏅鍘呮敹鏉熸垚涓€涓斁鏉句华寮?,
        "description": "鍑忓皯涓績鍖虹墿鍝侊紝璁╃獥澶栬閲庡拰涓€鐩忎富鐏垚涓虹湡姝ｇ殑涓昏銆?,
        "keywords": ["鏅", "浠紡鎰?, "鏀炬澗"],
    },
    {
        "user_name": "Rin",
        "title": "缁欏姬褰㈡矙鍙戜竴涓洿娓╂煍鐨勬櫄闂村満鏅?,
        "description": "鐢ㄦ墭鐩樺拰涓荤伅鍥哄畾澶滄櫄鑺傚锛岃鑱氫細鍚庣殑瀹夐潤鏇村鏄撳彂鐢熴€?,
        "keywords": ["寮у舰娌欏彂", "鏅氶棿", "鑱氫細鍚?],
    },
    {
        "user_name": "Sol",
        "title": "璁╁僵鑹茬幓鐠冩垚涓哄鍘呯殑涓昏",
        "description": "鍑忓皯鎶㈡垙瑁呴グ锛岃姣忓ぉ涓嶅悓鏃跺埢鐨勫厜鎴愪负绌洪棿琛ㄦ儏銆?,
        "keywords": ["褰╄壊鐜荤拑", "鍏夊奖", "涓昏鎰?],
    },
    {
        "user_name": "Mo",
        "title": "鎶婄豢鎰忓渾绐楃暀缁欎竴寮犵湡姝ｈ兘浼戞伅鐨勫簥",
        "description": "鎺у埗搴婅竟鐗╁搧锛屽彧鐣欎笅鐫″墠浼氱敤鍒扮殑涔︺€佺伅鍜屼竴鏉按銆?,
        "keywords": ["鍗у", "缁挎剰", "鐫″墠绉╁簭"],
    },
    {
        "user_name": "Iris",
        "title": "鎶婃．鏋楃獥杈规暣鐞嗘垚闃呰瑙?,
        "description": "鍥哄畾妞嶇墿銆佺伅鍜岃尪鍑犵殑浣嶇疆锛岃鍧愪笅杩欎欢浜嬫洿瀹规槗鍙戠敓銆?,
        "keywords": ["闃呰瑙?, "妫灄鎰?, "鍧愪笅"],
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

