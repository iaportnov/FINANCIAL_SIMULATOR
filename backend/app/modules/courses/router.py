from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.pagination import Page, PageParams, pagination_params
from app.modules.courses.schemas import CoursePublic, LessonPublic
from app.modules.courses.service import CoursesService

router = APIRouter(tags=["courses"])


def get_courses_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CoursesService:
    return CoursesService(session)


ServiceDep = Annotated[CoursesService, Depends(get_courses_service)]


@router.get("/courses", response_model=Page[CoursePublic])
async def list_courses(
    service: ServiceDep,
    page: Annotated[PageParams, Depends(pagination_params)],
) -> Page[CoursePublic]:
    items, total = await service.list_courses(page.limit, page.offset)
    return Page(
        items=[CoursePublic.model_validate(c) for c in items],
        total=total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get("/lessons/{lesson_id}", response_model=LessonPublic)
async def get_lesson(lesson_id: int, service: ServiceDep) -> LessonPublic:
    lesson = await service.get_lesson(lesson_id)
    return LessonPublic.model_validate(lesson)
