from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.posts.models.post import Post


class PostRepository(BaseRepository[Post]):
    def __init__(self, db: AsyncSession):
        super().__init__(Post, db)
