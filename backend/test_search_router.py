import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import app.main  # noqa: F401
from app.search.routers.search import global_search
from app.search.schemas.search import (
    EventSearchResult,
    GlobalSearchResponse,
    JobSearchResult,
    PostSearchResult,
    UserSearchResult,
)
from app.users.models.user import User


class TestSearchRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = User(id=1, email="test@example.com")
        self.db = MagicMock()

    @patch("app.search.routers.search.SearchService")
    async def test_global_search_all(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance

        mock_response = GlobalSearchResponse(
            query="test",
            total_results=4,
            users=[
                UserSearchResult(
                    id=1, email="test@example.com", first_name="Test", last_name="User"
                )
            ],
            posts=[
                PostSearchResult(
                    id=1,
                    content="test post",
                    author_id=1,
                    author_name="Test User",
                    created_at="2026-07-28",
                )
            ],
            jobs=[
                JobSearchResult(
                    id=1,
                    title="Test Engineer",
                    company_name="Tech Co",
                    job_type="FULL_TIME",
                )
            ],
            events=[
                EventSearchResult(
                    id=1,
                    title="Test Hackathon",
                    description="Cool event",
                    start_datetime="2026-08-01",
                )
            ],
        )
        service_instance.search_all.return_value = mock_response

        res = await global_search(
            q="test", category="all", limit=10, current_user=self.user, db=self.db
        )
        self.assertEqual(res.data.total_results, 4)
        self.assertEqual(len(res.data.users), 1)
        self.assertEqual(len(res.data.posts), 1)
        self.assertEqual(len(res.data.jobs), 1)
        self.assertEqual(len(res.data.events), 1)
        service_instance.search_all.assert_called_once_with(
            query="test", category="all", limit=10
        )


if __name__ == "__main__":
    unittest.main()
