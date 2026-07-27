from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standard envelope format for all successful API responses.
    """

    success: bool = True
    message: str | None = None
    data: T | None = None


class BasePageMeta(BaseModel):
    total: int
    page: int
    size: int
    pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standard response format for paginated queries.
    """

    success: bool = True
    message: str | None = None
    data: list[T]
    meta: BasePageMeta
