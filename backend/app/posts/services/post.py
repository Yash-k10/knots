from sqlalchemy.ext.asyncio import AsyncSession
from app.posts.repository.post import PostRepository
from app.posts.schemas.post import PostCreate
from app.posts.models.post import Post


class PostService:
    def __init__(self, db: AsyncSession):
        self.repository = PostRepository(db)

    async def create_post(self, author_id: int, post_in: PostCreate) -> Post:
        data = post_in.dict()
        data["author_id"] = author_id
        return await self.repository.create(data)

    async def list_posts(self, skip: int = 0, limit: int = 100) -> list[Post]:
        return await self.repository.get_multi(skip=skip, limit=limit)
