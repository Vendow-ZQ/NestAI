"""API路由模块"""

from .sessions import router as sessions_router
from .upload import router as upload_router
from .spaces import router as spaces_router

__all__ = ['sessions_router', 'upload_router', 'spaces_router']