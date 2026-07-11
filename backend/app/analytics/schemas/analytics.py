from pydantic import BaseModel


class SystemStats(BaseModel):
    total_users: int
    total_connections: int
    total_jobs: int
    total_posts: int
