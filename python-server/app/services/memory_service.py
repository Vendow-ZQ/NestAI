"""Memory服务 - 短期记忆和长期记忆管理

实现NestAI的双层记忆系统:
- 短期记忆(Session Memory): 单次链路的完整上下文
- 长期记忆(Persistent Memory): 跨链路的用户画像积累
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings
import json

settings = get_settings()
Base = declarative_base()


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


class MemoryService:
    """记忆服务"""

    def __init__(self, db: Session):
        self.db = db

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

        json_data = json.dumps(data, ensure_ascii=False, indent=2)

        if field == "space_analysis":
            memory.space_analysis = json_data
        elif field == "chat_responses":
            memory.chat_responses = json_data
        elif field == "intervention_plan":
            memory.intervention_plan = json_data
        elif field == "feedback":
            memory.feedback = json_data
        elif field == "letter_content":
            memory.letter_content = json_data

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
        return memory

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
            "intervention_history": long_term.intervention_history if long_term else ""
        }


# 数据库初始化
def init_db():
    """初始化数据库表"""
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """获取数据库会话"""
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()
