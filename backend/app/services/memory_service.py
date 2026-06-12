"""Memory服务 - 短期记忆和长期记忆管理

实现NestAI的双层记忆系统:
- 短期记忆(Session Memory): 单次链路的完整上下文
- 长期记忆(Persistent Memory): 跨链路的用户画像积累
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import re
from sqlalchemy import Column, Integer, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings
from app.core.levels import DEFAULT_LEVEL, normalize_level
import json

settings = get_settings()
Base = declarative_base()


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def _create_engine():
    url = _normalize_database_url(settings.database_url)
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class SessionMemoryModel(Base):
    """短期记忆数据库模型"""
    __tablename__ = "session_memories"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    space_id = Column(String, index=True)
    user_id = Column(String, index=True, default="dev_user")

    # 记忆内容(Markdown格式)
    content = Column(Text, default="")

    # 关键节点记录(JSON)
    space_analysis = Column(Text, default="{}")  # P001输出
    chat_responses = Column(Text, default="{}")  # Chat答案
    intervention_plan = Column(Text, default="{}")  # P002输出
    feedback = Column(Text, default="{}")  # 用户反馈
    letter_content = Column(Text, default="")  # P003输出

    status = Column(String, default="created")  # created/analyzing/chat_done/generated/saved/feedback_done/letter_done
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserModel(Base):
    """Lightweight user identity and profile anchor."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    display_name = Column(String, default="")
    email = Column(String, unique=True, nullable=True, index=True)
    avatar_url = Column(String, default="")
    profile_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LongTermMemoryModel(Base):
    """长期记忆数据库模型"""
    __tablename__ = "long_term_memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, default="dev_user")

    # 用户Lifestyle Profile
    lifestyle_profile = Column(Text, default="")  # Markdown格式

    # 空间历史记录
    space_history = Column(Text, default="")  # JSON数组

    # 偏好积累
    preferences = Column(Text, default="")  # Markdown格式

    # 干预历史摘要
    intervention_history = Column(Text, default="")  # Markdown格式

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SpaceModel(Base):
    """Persisted space record for uploaded rooms/desks."""
    __tablename__ = "spaces"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, default="dev_user")
    name = Column(String, default="")
    images = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowRunModel(Base):
    """Trace one AI workflow stage execution."""
    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    stage = Column(String, index=True)
    status = Column(String, default="started")
    input_json = Column(Text, default="{}")
    output_json = Column(Text, default="{}")
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FeedPostModel(Base):
    """Public Grow feed post."""
    __tablename__ = "feed_posts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, default="seed_user")
    user_name = Column(String, default="NestAI User")
    user_avatar = Column(String, default="")
    title = Column(String, default="")
    description = Column(Text, default="")
    image_url = Column(String, unique=True, index=True)
    location = Column(String, default="Shared Next")
    lifestyle_keywords = Column(Text, default="[]")
    status = Column(String, default="published")
    source = Column(String, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DismissedNextActionModel(Base):
    """Persist Next actions that a user removed or cleared."""
    __tablename__ = "dismissed_next_actions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, default="dev_user")
    next_action_id = Column(String, index=True)
    session_id = Column(String, index=True, default="")
    intervention_id = Column(String, index=True, default="")
    reason = Column(String, default="dismissed")
    created_at = Column(DateTime, default=datetime.utcnow)


class DismissedFeedCardModel(Base):
    """Persist Grow feed cards that should no longer be shown."""
    __tablename__ = "dismissed_feed_cards"

    id = Column(String, primary_key=True, index=True)
    feed_id = Column(String, unique=True, index=True)
    reason = Column(String, default="disliked")
    created_at = Column(DateTime, default=datetime.utcnow)


class MemoryService:
    """记忆服务"""

    def __init__(self, db: Session):
        self.db = db

    # ===== File-backed long-term memory =====

    @property
    def long_term_memory_root(self) -> Path:
        return Path(__file__).resolve().parents[2] / "memory" / "users"

    def _safe_user_id(self, user_id: str) -> str:
        safe = re.sub(r"[^a-zA-Z0-9_-]+", "_", user_id or "dev_user").strip("_")
        return safe or "dev_user"

    def get_long_term_memory_path(self, user_id: str = "dev_user") -> Path:
        return self.long_term_memory_root / self._safe_user_id(user_id) / "LongTermMemory.md"

    def _render_long_term_markdown(self, memory: LongTermMemoryModel) -> str:
        space_history = memory.space_history or ""
        return "\n".join([
            f"# NestAI LongTermMemory",
            "",
            f"- User: `{memory.user_id}`",
            f"- Created: {memory.created_at.isoformat() if memory.created_at else ''}",
            f"- Updated: {memory.updated_at.isoformat() if memory.updated_at else ''}",
            "",
            "## Lifestyle Profile",
            memory.lifestyle_profile.strip() or "_No stable lifestyle profile yet._",
            "",
            "## Preferences",
            memory.preferences.strip() or "_No explicit preferences yet._",
            "",
            "## Space History",
            space_history.strip() or "_No space history yet._",
            "",
            "## Intervention History",
            memory.intervention_history.strip() or "_No intervention history yet._",
            "",
        ])

    def _write_long_term_memory_file(self, memory: LongTermMemoryModel) -> Path:
        path = self.get_long_term_memory_path(memory.user_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self._render_long_term_markdown(memory), encoding="utf-8")
        return path

    # ===== User operations =====

    def get_user(self, user_id: str) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[UserModel]:
        if not email:
            return None
        return self.db.query(UserModel).filter(UserModel.email == email.lower()).first()

    def upsert_user(
        self,
        *,
        display_name: str,
        email: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> UserModel:
        import uuid

        normalized_email = email.strip().lower() if email else None
        user = self.get_user_by_email(normalized_email) if normalized_email else None
        if not user:
            safe_name = self._safe_user_id(display_name)[:24].lower()
            user_id = f"user_{safe_name}_{uuid.uuid4().hex[:8]}" if safe_name else f"user_{uuid.uuid4().hex[:10]}"
            user = UserModel(
                id=user_id,
                display_name=display_name.strip() or "NestAI User",
                email=normalized_email,
                avatar_url=avatar_url or "",
            )
            self.db.add(user)
        else:
            user.display_name = display_name.strip() or user.display_name or "NestAI User"
            if avatar_url is not None:
                user.avatar_url = avatar_url

        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        if not self.get_long_term_memory(user.id):
            self.create_long_term_memory(user.id)
        return user

    # ===== 短期记忆操作 =====

    def create_session_memory(self, session_id: str, space_id: str, user_id: str = "dev_user") -> SessionMemoryModel:
        """创建新的短期记忆记录"""
        memory = SessionMemoryModel(
            session_id=session_id,
            space_id=space_id,
            user_id=user_id,
            content=f"## Session Started\nTime: {datetime.utcnow().isoformat()}\n\n"
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory

    # ===== Space operations =====

    def create_space(self, space_id: str, images: List[str], user_id: str = "dev_user",
                     name: Optional[str] = None) -> SpaceModel:
        space = SpaceModel(
            id=space_id,
            user_id=user_id,
            name=name or "",
            images=json.dumps(images, ensure_ascii=False),
        )
        self.db.add(space)
        self.db.commit()
        self.db.refresh(space)
        return space

    def get_space(self, space_id: str) -> Optional[SpaceModel]:
        return self.db.query(SpaceModel).filter(SpaceModel.id == space_id).first()

    def list_spaces(self, user_id: str = "dev_user") -> List[SpaceModel]:
        return (
            self.db.query(SpaceModel)
            .filter(SpaceModel.user_id == user_id)
            .order_by(SpaceModel.created_at.desc())
            .all()
        )

    def list_session_memories(self, user_id: str = "dev_user", limit: int = 50) -> List[SessionMemoryModel]:
        return (
            self.db.query(SessionMemoryModel)
            .filter(SessionMemoryModel.user_id == user_id)
            .order_by(SessionMemoryModel.created_at.desc())
            .limit(limit)
            .all()
        )

    def list_public_session_memories(self, limit: int = 50) -> List[SessionMemoryModel]:
        return (
            self.db.query(SessionMemoryModel)
            .order_by(SessionMemoryModel.updated_at.desc())
            .limit(limit)
            .all()
        )

    # ===== Feed operations =====

    def upsert_feed_post(self, post: Dict[str, Any]) -> FeedPostModel:
        existing = self.db.query(FeedPostModel).filter(FeedPostModel.id == post["id"]).first()
        if not existing and post.get("image_url"):
            existing = self.db.query(FeedPostModel).filter(FeedPostModel.image_url == post["image_url"]).first()

        payload = {
            "user_id": post.get("user_id", "seed_user"),
            "user_name": post.get("user_name", "NestAI User"),
            "user_avatar": post.get("user_avatar", ""),
            "title": post.get("title", ""),
            "description": post.get("description", ""),
            "image_url": post.get("image_url", ""),
            "location": post.get("location", "Shared Next"),
            "lifestyle_keywords": json.dumps(post.get("lifestyle_keywords", []), ensure_ascii=False),
            "status": post.get("status", "published"),
            "source": post.get("source", "manual"),
            "updated_at": datetime.utcnow(),
        }

        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        feed_post = FeedPostModel(id=post["id"], **payload)
        self.db.add(feed_post)
        self.db.commit()
        self.db.refresh(feed_post)
        return feed_post

    def list_feed_posts(self, limit: int = 50) -> List[FeedPostModel]:
        return (
            self.db.query(FeedPostModel)
            .filter(FeedPostModel.status == "published")
            .order_by(FeedPostModel.created_at.desc())
            .limit(limit)
            .all()
        )

    def delete_feed_post(self, post_id: str) -> bool:
        post = self.db.query(FeedPostModel).filter(FeedPostModel.id == post_id).first()
        if not post:
            return False
        self.db.delete(post)
        self.db.commit()
        return True

    def dismiss_feed_card(self, feed_id: str, reason: str = "disliked") -> DismissedFeedCardModel:
        dismissed_id = f"feed:{feed_id}"
        existing = self.db.query(DismissedFeedCardModel).filter(DismissedFeedCardModel.id == dismissed_id).first()
        if existing:
            return existing

        dismissed = DismissedFeedCardModel(id=dismissed_id, feed_id=feed_id, reason=reason)
        self.db.add(dismissed)
        self.db.commit()
        self.db.refresh(dismissed)
        return dismissed

    def list_dismissed_feed_ids(self) -> set[str]:
        rows = self.db.query(DismissedFeedCardModel.feed_id).all()
        return {row[0] for row in rows if row and row[0]}

    # ===== Next dismiss operations =====

    def dismiss_next_action(
        self,
        user_id: str,
        next_action_id: str,
        session_id: str = "",
        intervention_id: str = "",
        reason: str = "dismissed",
    ) -> DismissedNextActionModel:
        dismissed_id = f"{user_id}:{next_action_id}"
        existing = self.db.query(DismissedNextActionModel).filter(DismissedNextActionModel.id == dismissed_id).first()
        if existing:
            return existing

        dismissed = DismissedNextActionModel(
            id=dismissed_id,
            user_id=user_id or "dev_user",
            next_action_id=next_action_id,
            session_id=session_id or "",
            intervention_id=intervention_id or "",
            reason=reason,
        )
        self.db.add(dismissed)
        self.db.commit()
        self.db.refresh(dismissed)
        return dismissed

    def list_dismissed_next_ids(self, user_id: str = "dev_user") -> set[str]:
        rows = (
            self.db.query(DismissedNextActionModel.next_action_id)
            .filter(DismissedNextActionModel.user_id == user_id)
            .all()
        )
        return {row[0] for row in rows if row and row[0]}

    def dismiss_all_next_actions(self, user_id: str = "dev_user", reason: str = "cleared") -> int:
        memories = self.list_session_memories(user_id, limit=500)
        count = 0
        for memory in memories:
            feedback = json.loads(memory.feedback) if memory.feedback else {}
            selected_level = normalize_level(feedback.get("selected_level") or DEFAULT_LEVEL)
            next_action_id = f"next-{memory.session_id}-{selected_level}"
            intervention_id = f"{memory.session_id}-{selected_level}"
            self.dismiss_next_action(
                user_id=user_id,
                next_action_id=next_action_id,
                session_id=memory.session_id,
                intervention_id=intervention_id,
                reason=reason,
            )
            count += 1
        return count

    # ===== Workflow trace operations =====

    def start_workflow_run(self, session_id: str, stage: str, input_data: Any = None) -> WorkflowRunModel:
        run = WorkflowRunModel(
            session_id=session_id,
            stage=stage,
            status="started",
            input_json=json.dumps(input_data or {}, ensure_ascii=False, indent=2),
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def finish_workflow_run(self, run_id: int, output_data: Any = None, error: Optional[str] = None):
        run = self.db.query(WorkflowRunModel).filter(WorkflowRunModel.id == run_id).first()
        if not run:
            return None

        run.status = "failed" if error else "completed"
        run.output_json = json.dumps(output_data or {}, ensure_ascii=False, indent=2)
        run.error = error or ""
        run.updated_at = datetime.utcnow()
        self.db.commit()
        return run

    def get_session_memory(self, session_id: str) -> Optional[SessionMemoryModel]:
        """获取短期记忆"""
        return self.db.query(SessionMemoryModel).filter(
            SessionMemoryModel.session_id == session_id
        ).first()

    def append_to_session_memory(self, session_id: str, content: str, section: Optional[str] = None):
        """追加内容到短期记忆"""
        memory = self.get_session_memory(session_id)
        if not memory:
            return None

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        if section:
            new_content = f"\n### {section} ({timestamp})\n{content}\n"
        else:
            new_content = f"\n{content}\n"

        memory.content += new_content
        memory.updated_at = datetime.utcnow()
        self.db.commit()
        return memory

    def update_session_field(self, session_id: str, field: str, data: Any):
        """更新短期记忆的特定字段"""
        memory = self.get_session_memory(session_id)
        if not memory:
            return None

        if field == "space_analysis":
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            memory.space_analysis = json_data
        elif field == "chat_responses":
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            memory.chat_responses = json_data
        elif field == "intervention_plan":
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            memory.intervention_plan = json_data
        elif field == "feedback":
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            memory.feedback = json_data
        elif field == "letter_content":
            memory.letter_content = str(data)

        memory.updated_at = datetime.utcnow()
        self.db.commit()
        return memory

    def update_session_status(self, session_id: str, status: str):
        """更新会话状态"""
        memory = self.get_session_memory(session_id)
        if memory:
            memory.status = status
            self.db.commit()
        return memory

    # ===== 长期记忆操作 =====

    def get_long_term_memory(self, user_id: str = "dev_user") -> Optional[LongTermMemoryModel]:
        """获取用户的长期记忆"""
        return self.db.query(LongTermMemoryModel).filter(
            LongTermMemoryModel.user_id == user_id
        ).first()

    def create_long_term_memory(self, user_id: str = "dev_user") -> LongTermMemoryModel:
        """创建新的长期记忆"""
        memory = LongTermMemoryModel(user_id=user_id)
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        self._write_long_term_memory_file(memory)
        return memory

    def update_long_term_memory(self, user_id: str, profile_update: str = None,
                               preference_update: str = None,
                               intervention_summary: str = None):
        """更新长期记忆（追加模式）"""
        memory = self.get_long_term_memory(user_id)
        if not memory:
            memory = self.create_long_term_memory(user_id)

        timestamp = datetime.utcnow().strftime("%Y-%m-%d")

        if profile_update:
            memory.lifestyle_profile += f"\n\n## {timestamp}\n{profile_update}"

        if preference_update:
            memory.preferences += f"\n\n## {timestamp}\n{preference_update}"

        if intervention_summary:
            memory.intervention_history += f"\n\n## {timestamp}\n{intervention_summary}"

        memory.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(memory)
        self._write_long_term_memory_file(memory)
        return memory

    def get_long_term_memory_markdown(self, user_id: str = "dev_user") -> str:
        """Return the user-facing Markdown long-term memory file."""
        memory = self.get_long_term_memory(user_id)
        if not memory:
            memory = self.create_long_term_memory(user_id)

        path = self.get_long_term_memory_path(user_id)
        if not path.exists():
            self._write_long_term_memory_file(memory)
        return path.read_text(encoding="utf-8")

    def get_compact_long_term_memory(self, user_id: str = "dev_user", max_chars: int = 2200) -> str:
        """Return a compact prompt-ready view of durable user memory."""
        memory = self.get_long_term_memory(user_id)
        if not memory:
            return ""

        sections = []
        if memory.lifestyle_profile.strip():
            sections.append("Lifestyle profile:\n" + memory.lifestyle_profile.strip()[-700:])
        if memory.preferences.strip():
            sections.append("Preferences:\n" + memory.preferences.strip()[-600:])
        if memory.intervention_history.strip():
            sections.append("Recent intervention history:\n" + memory.intervention_history.strip()[-900:])

        compact = "\n\n".join(sections).strip()
        if not compact:
            return ""
        return compact[-max_chars:]

    def get_memory_for_prompt(self, session_id: str, user_id: str = "dev_user") -> Dict[str, Any]:
        """
        获取用于Prompt的完整记忆上下文
        返回短期记忆和长期记忆的组合
        """
        short_term = self.get_session_memory(session_id)
        long_term = self.get_long_term_memory(user_id)

        return {
            "short_term": short_term.content if short_term else "",
            "long_term_profile": long_term.lifestyle_profile if long_term else "",
            "long_term_preferences": long_term.preferences if long_term else "",
            "intervention_history": long_term.intervention_history if long_term else "",
            "long_term_compact": self.get_compact_long_term_memory(user_id),
        }


# 数据库初始化
def init_db():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
