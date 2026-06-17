from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard list envelope: { items, total, limit, offset }."""

    items: list[T]
    total: int
    limit: int
    offset: int


class PageParams(BaseModel):
    limit: int = 20
    offset: int = 0


def pagination_params(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PageParams:
    return PageParams(limit=limit, offset=offset)
